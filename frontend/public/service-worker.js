/* PDI Quality System - lightweight Service Worker
 * Strategy:
 *  - Static assets (CSS/JS/fonts/images): cache-first
 *  - Navigation (HTML): network-first with offline fallback
 *  - API calls (/api/...): network-only (never cache - data must be fresh)
 */
const CACHE_VERSION = 'pdi-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/gautam-solar-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API
  if (url.pathname.startsWith('/api/') || url.hostname.includes('umanmrp') || url.hostname.includes('umanerp')) {
    return; // default network
  }

  // Navigation requests -> network-first, fallback to cached index
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // Static assets -> cache-first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((res) => {
              if (res && res.status === 200 && res.type === 'basic') {
                const copy = res.clone();
                caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
              }
              return res;
            })
            .catch(() => cached)
      )
    );
  }
});
