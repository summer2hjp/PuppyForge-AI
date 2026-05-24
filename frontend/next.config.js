/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.puppyforge.ai',
      },
      {
        protocol: 'https',
        hostname: '**', // 激进模式：允许更多 AI 生成图像源
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '20mb', // 加大：支持更疯的宠物记忆上传
    },
    // 开启现代优化
    optimizePackageImports: ['@serwist/next', 'lucide-react'],
  },

  // PWA 核心激进配置
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },

  // 未来证明的 webpack 配置（支持 WASM、更大 bundle 优化）
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

// 激进 PWA 包装（推荐使用 @serwist/next，最现代方案）
const withSerwist = require('@serwist/next').default({
  swSrc: 'app/sw.ts',           // 你的 Service Worker 入口
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  register: true,
  scope: '/',
  skipWaiting: true,
  clientsClaim: true,
});

module.exports = withSerwist(nextConfig);
