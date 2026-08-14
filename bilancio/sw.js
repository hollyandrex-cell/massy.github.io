const CACHE_NAME = 'hr-bilancio-v1.2';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './bilancio.html',
        './manifest.json'
        // Rimuoviamo js e css dalla cache iniziale - li carica da rete, così non fa errore se manca
      ]).catch(err => {
        console.log('Cache parziale:', err);
        return cache.addAll(['./', './bilancio.html']);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    })
  );
  self.clients.claim();
});
