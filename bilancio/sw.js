self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('hr-bilancio-v1').then((cache) => {
    return cache.addAll(['./', './bilancio.html', './js/bilancio.js']);
  }));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((response) => {
    return response || fetch(e.request);
  }));
});