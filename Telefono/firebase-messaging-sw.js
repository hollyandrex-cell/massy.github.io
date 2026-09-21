
// Service Worker V3 COMPLETO - Holly & Rex - Aura Live + cache Telefono
const CACHE_NAME = 'assistente-vocale-v4-completo';
const ASSETS = [
  './',
  './assistente-vocale.html',
  './manifest.json',
  './bau-192x192.png',
  './bau-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Firebase compat per background push
try {
  importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');
  
  const firebaseConfig = {
    apiKey: "AIzaSyAR8NVxtUu5QhlDWd0DXjp1lWV6vLdRM1c",
    authDomain: "holly-rex-spesa.firebaseapp.com",
    projectId: "holly-rex-spesa",
    storageBucket: "holly-rex-spesa.firebasestorage.app",
    messagingSenderId: "450072023944",
    appId: "1:450072023944:web:888af5555a5b50c599203d"
  };
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[SW V4] Background Message:', payload);
    const title = payload.notification?.title || payload.data?.title || 'Holly & Rex - Aura';
    const body = payload.notification?.body || payload.data?.body || payload.data?.message || 'Nuovo messaggio per la crew';
    const personaggio = payload.data?.personaggio || 'Aura';
    
    const options = {
      body: body,
      icon: './bau-192x192.png',
      badge: './bau-32.png',
      vibrate: [200, 100, 200],
      data: { personaggio, body, title, ...payload.data },
      tag: 'aura-live-' + Date.now()
    };
    return self.registration.showNotification(title, options);
  });
} catch(err){
  console.log('Firebase compat non caricato in SW, uso fallback', err);
}

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/') || e.request.method !== 'GET') return;
  if (e.request.url.includes('fcm') || e.request.url.includes('googleapis')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});

self.addEventListener('push', (event) => {
  if (event.data && event.data.json) {
    try {
      const dati = event.data.json();
      if(dati.notification || dati.data) {
        if(self.firebase && self.firebase.messaging) return;
      }
      const titolo = dati.notification?.title || 'Holly & Rex - Assistente';
      const messaggio = dati.notification?.body || 'Nuovo messaggio in arrivo';
      const opzioni = {
        body: messaggio,
        icon: './bau-192x192.png',
        badge: './bau-32.png',
        vibrate: [200, 100, 200],
        data: dati.data || {}
      };
      event.waitUntil(
        self.registration.showNotification(titolo, opzioni)
      );
    } catch(e){
      console.log('Push non JSON', e);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil(
    clients.matchAll({type:'window'}).then(clientList => {
      for(const client of clientList){
        if(client.url.includes('assistente-vocale') && 'focus' in client){
          client.postMessage({type:'AURA_READ', data});
          return client.focus();
        }
      }
      return clients.openWindow('./assistente-vocale.html');
    })
  );
});

self.addEventListener('message', (event)=>{
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
