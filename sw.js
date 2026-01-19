
const CACHE_NAME = 'queencheck-v1';

// نحن نقوم بإنشاء ملف بسيط جداً فقط لاستيفاء شروط PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // تمرير الطلبات كالمعتاد
  event.respondWith(fetch(event.request));
});
