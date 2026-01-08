importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAhAkJUSPO8jdgLh4o13al1PSRYdvX5e8I",
  authDomain: "dot-occupational-therapy-dddc2.firebaseapp.com",
  projectId: "dot-occupational-therapy-dddc2",
  storageBucket: "dot-occupational-therapy-dddc2.appspot.com",
  messagingSenderId: "986445440183",
  appId: "1:986445440183:web:24c1f1cc3ce58553d0d932"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
