// firebase-messaging-sw.js - VERSIONE SOLO GITHUB PAGES
// Metti questo file in /Telefono/ su GitHub, nella stessa cartella di assistente-vocale.html
// Su GitHub Pages funziona al primo colpo, su VSCode darà ancora 404 (ma a noi ora non interessa)

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
  console.log('[firebase-messaging-sw.js] GitHub Pages - Background:', payload);
  const title = payload.notification?.title || payload.data?.title || 'Aura Live - Holly & Rex';
  const body = payload.notification?.body || payload.data?.body || 'Nuovo messaggio crew';
  
  return self.registration.showNotification(title, {
    body: body,
    icon: './bau-192x192.png',
    badge: './bau-32.png',
    vibrate: [200, 100, 200],
    data: payload.data || {}
  });
});
