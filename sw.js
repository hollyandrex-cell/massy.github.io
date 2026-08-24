const CACHE_NAME = 'hr-group-v1-root';
const urlsToCache = [
  '/massy.github.io/',
  '/massy.github.io/index.html',
  '/massy.github.io/manifest.json',
  '/massy.github.io/bau-32.png',
  '/massy.github.io/bau-192x192.png',
  '/massy.github.io/bau-512x512.png',
  '/massy.github.io/bau-180.png',
  '/massy.github.io/bau.ico',
  '/massy.github.io/spesa/spesa.html',
  '/massy.github.io/ricette/index.html',
  '/massy.github.io/bilancio/bilancio.html',
  '/massy.github.io/pet_diary/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache.map(u => new Request(u, {cache: 'reload'}))).catch(err => {
        console.log('Cache parziale', err);
        return Promise.allSettled(urlsToCache.map(u => cache.add(u).catch(e => console.log('Skip', u))));
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
console.log('SW Holly & Rex Group v1 root ok');