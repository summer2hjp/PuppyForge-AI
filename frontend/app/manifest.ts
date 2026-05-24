import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PuppyForge AI',
    short_name: 'PuppyForge',
    description: '你的AI数字疯狗伙伴 - 实时进化、记忆漂移、灵魂共生',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#ff2d55',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: '唤醒疯狗',
        short_name: 'Interact',
        url: '/interact',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: '宠物记忆库',
        short_name: 'Memory',
        url: '/memory',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
    categories: ['entertainment', 'lifestyle', 'social'],
    lang: 'zh-CN',
  };
}
