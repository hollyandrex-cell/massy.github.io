const CACHE_NAME = 'hr-bilancio-v1.1'; // Cambiamo versione così si aggiorna

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => {
    return cache.addAll([
      './', 
      './bilancio.html', 
      './js/bilancio.js',
      './css/bilancio.css',    // ← Aggiunto: così lo stile resta figo offline
      './manifest.json'       // ← Aggiunto: per installarla come app
    ]);
  }));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((response) => {
    return response || fetch(e.request);
  }));
});

// Bonus: pulisce le cache vecchie quando aggiorni
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );
});