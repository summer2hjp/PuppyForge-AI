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

self.addEventListener('install', (event: InstallEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event: ActivateEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// ✅ 修复 TS7031：显式声明 request 类型
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

// ✅ 修复 TS2339：使用 PushEvent 类型
self.addEventListener('push', (event: PushEvent) => {
  if (event.data) {
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
  }
});

// ✅ 修复 TS2339：使用 SyncEvent 类型
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-pet-data') {
    event.waitUntil(
      console.log('[SW] Background sync triggered')
    );
  }
});
