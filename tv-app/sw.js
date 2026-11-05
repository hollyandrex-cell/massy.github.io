const CACHE = 'hrt-tv-app-v4'; // <--- AGGIORNATO A v4 PER FORZARE NUOVA CACHE!

// INSTALLAZIONE: Salva i file base
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      './', 
      './index.html', 
      './manifest.json', 
      './icon-192.png', 
      './icon-512.png'
    ]))
  );
  self.skipWaiting();
});

// ATTIVAZIONE: Cancella le vecchie cache (v3, v2, ecc.)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

// FETCH: STRATEGIA NETWORK FIRST (La chiave per gli aggiornamenti!)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request) // 1. Prova SEMPRE a scaricare dal network
      .then(response => {
        // 2. Se scarica con successo, aggiorna la cache in background
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE).then(cache => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 3. Solo se NON c'è internet, usa la cache
        return caches.match(e.request).then(r => r || caches.match('./index.html'));
      })
  );
});