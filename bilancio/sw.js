const CACHE_NAME = 'hr-bilancio-v1.3-fix';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  console.log('SW install - cache bypass per GitHub Pages');
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
