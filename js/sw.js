const CACHE_NAME = 'qrcode-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/create.html',
  '/scan.html',
  '/myqrs.html',
  '/history.html',
  '/settings.html',
  '/css/style.css',
  '/js/main.js',
  '/js/database.js',
  '/js/create.js',
  '/js/scan.js',
  '/js/myqrs.js',
  '/js/history.js',
  '/js/settings.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// إدارة الطلبات
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا وجدنا الملف في الكاش نرجعه
        if (response) {
          return response;
        }

        // إذا لم نجده نحمله من الشبكة
        return fetch(event.request).then(response => {
          // تحقق من أن الاستجابة صالحة
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // استنسخ الاستجابة
          const responseToCache = response.clone();

          // خزنها في الكاش
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      }).catch(() => {
        // إذا فشل الاتصال بالشبعة، نعرض صفحة بدون اتصال
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});
