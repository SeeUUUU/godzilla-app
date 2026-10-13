// Godzilla Language Adventure - Service Worker
const CACHE_NAME = 'godzilla-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/images/godzilla.png',
  '/images/godzilla-chibi.png'
];

// 설치 단계: 기본 정적 에셋 프리캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching non-fatal error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 활성화 단계: 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch 전략:
// - HTML 네비게이션: Network First (최신 버전 우선), 실패 시 캐시
// - 정적 리소스(이미지, CSS, JS): Stale-While-Revalidate
// - Firestore / 외부 API 요청은 SW 캐싱 건너뜀
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // GET 요청만 캐싱 대상
  if (request.method !== 'GET') return;

  // 외부 도메인 API(Firebase, Google TTS 등)는 네트워크 직접 사용
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML 네비게이션 요청 (새로고침 등)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 그 외 정적 자원 (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
