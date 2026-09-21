// firebase-messaging-sw.js - DEVE stare nella stessa cartella di assistente-vocale.html
// Questo è il file che Firebase cercava e non trovava (errore 404)

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
  console.log('[firebase-messaging-sw.js] Background:', payload);
  const title = payload.notification?.title || payload.data?.title || 'Aura Live';
  const body = payload.notification?.body || payload.data?.body || 'Nuovo messaggio crew';
  
  const options = {
    body: body,
    icon: './bau-192x192.png',
    badge: './bau-32.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
    tag: 'aura-live'
  };
  return self.registration.showNotification(title, options);
});
