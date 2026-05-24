/// <reference lib="webworker" />

const CACHE_NAME = 'puppyforge-soul-v1.4';
const OFFLINE_URL = '/offline.html';

const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png',
];

// 激进缓存策略配置
self.addEventListener('install', (event: any) => {
  console.log('🐕‍🦺 PuppyForge Service Worker 正在觉醒 v1.4...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 正在缓存核心疯狗资源...');
      return cache.addAll(CORE_ASSETS);
    })
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 清除旧版本疯狗缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 核心 Fetch 拦截 - 激进分流策略
self.addEventListener('fetch', (event: any) => {
  const url = new URL(event.request.url);

  // 1. API 请求（宠物记忆、进化、交互）→ 网络优先，失败用缓存
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || new Response(JSON.stringify({ 
            error: "离线模式", 
            message: "疯狗正在本地继续进化..." 
          }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
          });
        })
    );
    return;
  }

  // 2. 静态资源 + 图标 + 图像 → 缓存优先，加速加载
  if (['image', 'font', 'style', 'script'].includes(event.request.destination) || 
      CORE_ASSETS.includes(url.pathname) ||
      url.pathname.endsWith('.png') || 
      url.pathname.endsWith('.jpg') ||
      url.pathname.includes('cdn.puppyforge')) {
    
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
    return;
  }

  // 3. 默认策略：网络优先，彻底失败进入离线疯狗页面
  event.respondWith(
    fetch(event.request)
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        
        // 最终兜底：显示离线疯狗页面
        return caches.match(OFFLINE_URL);
      })
  );
});

// 后台同步（未来可用于云端记忆同步）
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'puppy-memory-sync') {
    event.waitUntil(
      (async () => {
        console.log('🔄 正在执行疯狗记忆云端同步...');
        // 可接入 IndexedDB + API 同步逻辑
      })()
    );
  }
});

// 推送通知支持（后续可扩展）
self.addEventListener('push', (event: any) => {
  const data = event.data.json();
  self.registration.showNotification('🐕‍🦺 PuppyForge', {
    body: data.message || '你的疯狗想你了...',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200]
  });
});

console.log('🚀 PuppyForge PWA Service Worker 已完全觉醒 v1.4 - 灵魂永不掉线！');
