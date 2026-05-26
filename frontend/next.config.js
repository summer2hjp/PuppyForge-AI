/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔑 Docker 多阶段构建必需 (生成 .next/standalone 独立运行包)
  output: 'standalone',

  // 🛡️ 开发与代码质量
  reactStrictMode: true,
  poweredByHeader: false, // 移除 X-Powered-By 头部

  // 🖼️ 图片优化配置
  images: {
    domains: [
      'cdn.puppyforge.ai',
      'avatars.githubusercontent.com',
      'localhost',
      '127.0.0.1'
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [320, 420, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // 🔐 安全响应头 (生产环境推荐)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // ⚠️ CSP 建议在生产环境通过 CDN/WAF 管理，此处为开发友好基线
          { 
            key: 'Content-Security-Policy', 
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss: ws:;" 
          }
        ],
      },
    ];
  },

  // ⚙️ Webpack 微调 (解决浏览器端 Node.js 模块报错)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
      };
    }
    return config;
  },

  // 🐕‍🦺 PWA 配置 (若使用 @ducanh2912/next-pwa 插件)
  // 安装: npm i -D @ducanh2912/next-pwa
  // 启用下方配置即可自动注入 Service Worker
  // pwa: {
  //   dest: 'public',
  //   disable: process.env.NODE_ENV === 'development',
  //   register: true,
  //   skipWaiting: true,
  //   runtimeCaching: require('./pwa-cache-config.js'),
  // },
};

module.exports = nextConfig;
