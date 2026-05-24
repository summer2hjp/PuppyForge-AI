/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // 优化部署体积和启动速度

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // 激进模式：允许任意 AI 生成图片源
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '20mb', // 支持大尺寸宠物记忆与多模态数据
    },
    optimizePackageImports: ['@serwist/next', 'lucide-react', 'framer-motion'],
  },

  // PWA 核心 Headers 配置
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
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },

  // Webpack 增强（支持 WASM、更大内存）
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // 性能激进优化
    config.optimization.splitChunks = {
      ...config.optimization.splitChunks,
      chunks: 'all',
    };

    return config;
  },
};

// ==================== 狂暴 PWA 包装器 ====================
const withSerwist = require('@serwist/next').default({
  swSrc: 'app/sw.ts',           // 指向我们刚写的狂暴 Service Worker
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development', // 开发环境关闭避免冲突
  register: true,
  scope: '/',
  skipWaiting: true,
  clientsClaim: true,
  importScripts: [], // 可后续添加更多 worker
});

module.exports = withSerwist(nextConfig);
