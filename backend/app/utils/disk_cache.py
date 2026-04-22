"""
Disk-backed caches that survive pm2 restarts.

Three caches:
- pack_cache         : per-barcode pack status (terminal=24h, pending=15min)
- pdi_status_cache   : full /pdi-status response per (pdi_id, party_id)
- party_dispatch_cache: bulk party-dispatch-history per (party_id, days)

All saved as JSON in backend/cache/. Atomic write via .tmp + rename.
Loaded once at module import; periodically flushed by save_*().
"""
from __future__ import annotations

import json
import os
import threading
import time
import copy

_CACHE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'cache',
)
os.makedirs(_CACHE_DIR, exist_ok=True)

_PACK_FILE = os.path.join(_CACHE_DIR, 'pack_cache.json')
_PDI_FILE = os.path.join(_CACHE_DIR, 'pdi_status_cache.json')
_PARTY_DISPATCH_FILE = os.path.join(_CACHE_DIR, 'party_dispatch_cache.json')

_lock = threading.Lock()


def _load(path: str) -> dict:
    try:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                d = json.load(f)
                if isinstance(d, dict):
                    return d
    except Exception as e:
        print(f"[disk_cache] load {path} failed: {e}")
    return {}


def _save(path: str, data: dict) -> None:
    tmp = path + '.tmp'
    # Cache dictionaries are updated by multiple request/warmer threads.
    # Take a stable snapshot first, then persist atomically.
    snapshot = None
    for _ in range(5):
        try:
            snapshot = copy.deepcopy(data)
            break
        except RuntimeError as e:
            # e.g. "dictionary changed size during iteration"
            if 'changed size during iteration' in str(e):
                time.sleep(0.02)
                continue
            raise
    if snapshot is None:
        print(f"[disk_cache] save {path} failed: could not snapshot cache after retries")
        return

    try:
        with _lock:
            with open(tmp, 'w', encoding='utf-8') as f:
                json.dump(snapshot, f)
            os.replace(tmp, path)
    except Exception as e:
        print(f"[disk_cache] save {path} failed: {e}")


def load_pack_cache() -> dict:
    """{ serial: {'t': ts, 'status': 'packed'|'pending', 'info': {...}} }"""
    d = _load(_PACK_FILE)
    print(f"[disk_cache] loaded {len(d)} pack entries from disk")
    return d


def save_pack_cache(cache: dict) -> None:
    _save(_PACK_FILE, cache)


def load_pdi_status_cache() -> dict:
    """{ 'pdi|party|days': {'timestamp': ts, 'data': {...}} }"""
    return _load(_PDI_FILE)


def save_pdi_status_cache(cache: dict) -> None:
    _save(_PDI_FILE, cache)


def load_party_dispatch_cache() -> dict:
    """{ 'party_id|days': {'timestamp': ts, 'data': {serial: {...}}} }"""
    return _load(_PARTY_DISPATCH_FILE)


def save_party_dispatch_cache(cache: dict) -> None:
    _save(_PARTY_DISPATCH_FILE, cache)
