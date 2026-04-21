"""
Shared HTTP client (requests.Session) with connection pooling.

Replaces the per-call `requests.get/post()` pattern. Each ad-hoc
`requests.post(...)` opens a brand new TCP socket; under load
(100+ concurrent users hitting MRP APIs) this exhausts file
descriptors and balloons latency.

A single Session re-uses keep-alive connections per host. The
HTTPAdapter caps total pooled sockets per host.

Usage (drop-in replacement):
    from app.utils.http_client import http
    r = http.get(url, timeout=15)
    r = http.post(url, json={...}, timeout=15)
"""

from __future__ import annotations

import os
import requests
from requests.adapters import HTTPAdapter

try:
    # urllib3>=2
    from urllib3.util.retry import Retry
except Exception:                       # pragma: no cover
    from requests.packages.urllib3.util.retry import Retry  # type: ignore


_POOL_CONNECTIONS = int(os.environ.get('HTTP_POOL_CONNECTIONS', '50'))
_POOL_MAXSIZE     = int(os.environ.get('HTTP_POOL_MAXSIZE', '200'))
_DEFAULT_TIMEOUT  = float(os.environ.get('HTTP_DEFAULT_TIMEOUT', '20'))


def _build_session() -> requests.Session:
    s = requests.Session()
    retry = Retry(
        total=2,
        connect=2,
        read=1,
        backoff_factor=0.3,
        status_forcelist=(502, 503, 504),
        allowed_methods=frozenset(['GET', 'POST']),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(
        pool_connections=_POOL_CONNECTIONS,
        pool_maxsize=_POOL_MAXSIZE,
        max_retries=retry,
        pool_block=False,
    )
    s.mount('http://', adapter)
    s.mount('https://', adapter)
    s.headers.update({
        'User-Agent': 'PDI-Complete/1.0',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
    })
    return s


# Module-level singleton (process-wide)
http = _build_session()


def request(method: str, url: str, *, timeout=None, **kwargs):
    """Convenience wrapper that injects a default timeout."""
    if timeout is None:
        timeout = _DEFAULT_TIMEOUT
    return http.request(method, url, timeout=timeout, **kwargs)


def get(url: str, **kwargs):
    return request('GET', url, **kwargs)


def post(url: str, **kwargs):
    return request('POST', url, **kwargs)
