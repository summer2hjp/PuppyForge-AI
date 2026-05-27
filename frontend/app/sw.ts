// ========================================
// Service Worker - PWA 离线支持
// ========================================

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

const CACHE_NAME = 'puppyforge-v1';
const STATIC_ASSETS = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

// ✅ 修复 TS2304：Next.js SW 上下文不直接暴露 InstallEvent/ActivateEvent
// 使用 Event + ExtendableEvent 断言，100% 兼容 TypeScript 严格模式
self.addEventListener('install', (event: Event) => {
  (event as ExtendableEvent).waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event: Event) => {
  (event as ExtendableEvent).waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// 🌐 路由策略
registerRoute(
  ({ request }: { request: Request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  })
);

registerRoute(
  ({ request }: { request: Request }) => request.mode === 'navigate',
  new NetworkFirst({ cacheName: 'pages-cache', networkTimeoutSeconds: 10 })
);

registerRoute(
  ({ request }: { request: Request }) =>
    request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({ cacheName: 'static-resources' })
);

// 🔔 Push 通知
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

// 🔄 Background Sync
// ✅ 修复 TS2304/TS2339：使用 ServiceWorkerGlobalScopeEventMap 安全获取 tag/waitUntil
self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as ServiceWorkerGlobalScopeEventMap['sync'];
  if (syncEvent.tag === 'sync-pet-data') {
    syncEvent.waitUntil(
      Promise.resolve(console.log('[SW] Background sync triggered for pet data'))
    );
  }
});
