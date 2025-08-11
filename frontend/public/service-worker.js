/* Basic service worker for offline support */
const CACHE_NAME = 'globetrotter-cache-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(resp => {
        const copy = resp.clone();
        if (resp.ok && request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return resp;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
