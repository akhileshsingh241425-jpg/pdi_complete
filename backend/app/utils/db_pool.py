"""
Shared MySQL connection pool.

Replaces the per-request `pymysql.connect()` pattern. Under load
(100+ concurrent users) creating a fresh TCP+auth handshake per
request thrashes both the app server and MySQL.

Usage (drop-in replacement):
    from app.utils.db_pool import get_db_connection
    conn = get_db_connection()        # checked out from pool
    try:
        cursor = conn.cursor()
        ...
    finally:
        cursor.close()
        conn.close()                  # returned to pool, NOT torn down

Tunables via environment:
    DB_POOL_MAX        max idle/active conns held by pool   (default 30)
    DB_POOL_MIN        warm conns kept alive                (default 4)
    DB_POOL_PING_SEC   ping interval to validate conn       (default 60)
"""

from __future__ import annotations

import os
import time
import threading
import queue
import pymysql
from config import Config


_POOL_MAX = int(os.environ.get('DB_POOL_MAX', '30'))
_POOL_MIN = int(os.environ.get('DB_POOL_MIN', '4'))
_PING_INTERVAL = int(os.environ.get('DB_POOL_PING_SEC', '60'))

_pool: "queue.LifoQueue[_PooledConn]" = queue.LifoQueue(maxsize=_POOL_MAX)
_pool_lock = threading.Lock()
_created = 0


def _make_raw_conn():
    return pymysql.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        connect_timeout=10,
        read_timeout=60,
        write_timeout=60,
        charset='utf8mb4',
    )


class _PooledConn:
    """
    Thin wrapper over pymysql Connection. `close()` returns the
    connection to the pool instead of tearing down the TCP socket.
    Anything else delegates to the underlying connection.
    """

    __slots__ = ('_conn', '_last_used', '_closed')

    def __init__(self, raw):
        self._conn = raw
        self._last_used = time.time()
        self._closed = False

    # Pretend to be a pymysql.Connection
    def __getattr__(self, item):
        return getattr(self._conn, item)

    def cursor(self, *a, **kw):
        return self._conn.cursor(*a, **kw)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        try:
            return self._conn.rollback()
        except Exception:
            pass

    def close(self):
        """Return to pool (or destroy if pool full / conn dead)."""
        if self._closed:
            return
        self._closed = True
        # Best-effort rollback on uncommitted txn
        try:
            self._conn.rollback()
        except Exception:
            pass
        try:
            _pool.put_nowait(self)
            self._closed = False  # re-usable
            self._last_used = time.time()
        except queue.Full:
            self._destroy()

    def _destroy(self):
        global _created
        try:
            self._conn.close()
        except Exception:
            pass
        with _pool_lock:
            _created = max(0, _created - 1)


def _validate(pc: _PooledConn) -> bool:
    """Return True if connection still alive."""
    try:
        if (time.time() - pc._last_used) > _PING_INTERVAL:
            pc._conn.ping(reconnect=True)
        return True
    except Exception:
        pc._destroy()
        return False


def get_db_connection() -> _PooledConn:
    """Check out a pooled connection. Caller must call `.close()`."""
    global _created

    # Try existing pool first
    while True:
        try:
            pc = _pool.get_nowait()
        except queue.Empty:
            break
        if _validate(pc):
            pc._closed = False
            return pc

    # Pool empty: create new if under cap
    with _pool_lock:
        if _created < _POOL_MAX:
            _created += 1
            create_new = True
        else:
            create_new = False

    if create_new:
        try:
            return _PooledConn(_make_raw_conn())
        except Exception:
            with _pool_lock:
                _created -= 1
            raise

    # Pool fully utilised — block briefly waiting for return
    pc = _pool.get(timeout=15)
    if not _validate(pc):
        # dead conn returned, try once more
        return get_db_connection()
    pc._closed = False
    return pc


def warm_pool():
    """Pre-create _POOL_MIN connections at startup (best-effort)."""
    global _created
    for _ in range(_POOL_MIN):
        try:
            with _pool_lock:
                if _created >= _POOL_MAX:
                    return
                _created += 1
            _pool.put_nowait(_PooledConn(_make_raw_conn()))
        except Exception as e:
            with _pool_lock:
                _created = max(0, _created - 1)
            print(f"[db_pool] warm failed: {e}")
            return
    print(f"[db_pool] warmed {_POOL_MIN} connections (max={_POOL_MAX})")


def pool_stats():
    return {
        'created': _created,
        'idle': _pool.qsize(),
        'max': _POOL_MAX,
    }
