// ========================================
// Service Worker - PWA 离线支持
// ========================================

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// 缓存配置
const CACHE_NAME = 'puppyforge-v1';
const STATIC_ASSETS = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

// ✅ Install: 预缓存静态资源
self.addEventListener('install', (event: Event) => {
  (event as ExtendableEvent).waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ✅ Activate: 清理旧缓存
self.addEventListener('activate', (event: Event) => {
  (event as ExtendableEvent).waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// ✅ Fetch: 原生实现 Workbox 路由策略
self.addEventListener('fetch', (event: Event) => {
  const e = event as FetchEvent;
  const { request } = e;

  // 1. 图片：Cache First (原 workbox CacheFirst)
  if (request.destination === 'image') {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open('images-cache').then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 2. 页面导航：Network First (原 workbox NetworkFirst)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // 3. 脚本/样式：Stale While Revalidate (原 workbox StaleWhileRevalidate)
  if (request.destination === 'script' || request.destination === 'style') {
    e.respondWith(
      caches.open('static-resources').then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return cached || fetchPromise;
        })
      )
    );
  }
});

// ✅ Push: 推送通知
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification('🐕‍🦺 PuppyForge', {
      body: data.body || '你有新的消息',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: data.tag || 'default',
      requireInteraction: true,
    })
  );
});

// ✅ Sync: 后台同步 (彻底修复 TS2339)
interface BackgroundSyncEvent extends ExtendableEvent {
  tag: string;
  lastChance: boolean;
}

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as BackgroundSyncEvent;
  if (syncEvent.tag === 'sync-pet-data') {
    syncEvent.waitUntil(Promise.resolve(console.log('[SW] Background sync triggered for pet data')));
  }
});
