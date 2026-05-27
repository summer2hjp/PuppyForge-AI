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

// ✅ Fetch: 原生实现缓存策略
self.addEventListener('fetch', (event: Event) => {
  const e = event as FetchEvent;
  const { request } = e;

  // 1. 图片：Cache First
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

  // 2. 页面导航：Network First ✅ 修复 TS2345
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(async () => {
        // 确保 fallback 始终返回 Response，消除 undefined 类型
        const cached = await caches.match('/');
        return cached || new Response('离线模式', { 
          status: 503, 
          headers: { 'Content-Type': 'text/html; charset=utf-8' } 
        });
      })
    );
    return;
  }

  // 3. 脚本/样式：Stale While Revalidate
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

// ✅ Sync: 后台同步
interface BackgroundSyncEvent extends ExtendableEvent {
  tag: string;
  lastChance: boolean;
}

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as BackgroundSyncEvent;
  if (syncEvent.tag === 'sync-pet-data') {
    syncEvent.waitUntil(
      Promise.resolve(console.log('[SW] Background sync triggered for pet data'))
    );
  }
});
