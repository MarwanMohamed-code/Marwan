
// هذا الملف يعمل في الخلفية لاستقبال الإشعارات حتى والتطبيق مغلق
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js');

// 1. إعدادات فايربيس (تم التحديث لبيانات مشروعك الجديد)
const firebaseConfig = {
  apiKey: "AIzaSyDFJZW5QG3loOTbQfyBoJVmCSH7FtYo6fk",
  authDomain: "al-maalem-ahaaaa.firebaseapp.com",
  projectId: "al-maalem-ahaaaa",
  storageBucket: "al-maalem-ahaaaa.firebasestorage.app",
  messagingSenderId: "230355286592",
  appId: "1:230355286592:web:de07f7eab8897f3ec0bda5",
  measurementId: "G-MW91QYGT5S"
};

// 2. تهيئة التطبيق في الخلفية
firebase.initializeApp(firebaseConfig);

// 3. استدعاء خدمة الرسائل
const messaging = firebase.messaging();

// 4. التعامل مع الرسائل القادمة في الخلفية
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png', // أيقونة التطبيق (تأكد من وجود صورة بهذا الاسم)
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: {
        url: payload.data?.url || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 5. التعامل مع النقر على الإشعار (فتح التطبيق)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // فتح الرابط عند الضغط
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
