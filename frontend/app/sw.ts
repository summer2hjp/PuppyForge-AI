// ========================================
// Service Worker - PWA 离线支持
// ========================================

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;  // ✅ 关键：声明 self 类型

import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// 缓存配置
const CACHE_NAME = 'puppyforge-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ✅ 修复：使用 self.skipWaiting() 正确类型
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // ✅ 修复：skipWaiting 在 ServiceWorkerGlobalScope 中存在
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  // ✅ 修复：clients 在 ServiceWorkerGlobalScope 中存在
  self.clients.claim();
  console.log('[SW] Activated');
});

// 路由策略
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
      }),
    ],
  })
);

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 10,
  })
);

registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// ✅ 修复：showNotification 在 ServiceWorkerGlobalScope 中存在
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      // ✅ 修复：registration 在 ServiceWorkerGlobalScope 中存在
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

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pet-data') {
    event.waitUntil(
      // 执行数据同步逻辑
      console.log('[SW] Syncing pet data...')
    );
  }
});
