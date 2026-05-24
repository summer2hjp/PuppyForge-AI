/// <reference lib="webworker" />

const CACHE_NAME = 'puppyforge-v1.3-soul';
const OFFLINE_URL = '/offline.html'; // 可选创建离线页面

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png',
];

// 激进缓存策略：AI宠物核心资源优先
self.addEventListener('install', (event: any) => {
  console.log('🐕‍🦺 PuppyForge Service Worker 正在觉醒...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ 清除旧疯狗缓存:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 核心拦截策略
self.addEventListener('fetch', (event: any) => {
  const url = new URL(event.request.url);

  // 1. API 请求 - 网络优先，失败进缓存（支持离线互动）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. 静态资源 + 图片 - 缓存优先，加速疯狗图像加载
  if (
    event.request.destination === 'image' ||
    STATIC_ASSETS.includes(url.pathname) ||
    event.request.url.includes('cdn.puppyforge')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
    return;
  }

  // 3. 默认网络优先，回退离线
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
      .then((response) => response || caches.match(OFFLINE_URL))
  );
});

// 后台同步（未来可扩展宠物记忆云端同步）
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'puppy-memory-sync') {
    event.waitUntil(
      // 这里可以接入 IndexedDB 同步宠物记忆漂移
      console.log('🔄 疯狗记忆正在云端同步...')
    );
  }
});

console.log('🚀 PuppyForge PWA Service Worker 已完全觉醒！');
