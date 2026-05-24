import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PWAInitializer from '@/components/PWAInitializer'; // 后续可新增

const inter = Inter({ 
  subsets: ['latin'], 
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'PuppyForge AI - 你的数字疯狗灵魂伙伴',
  description: '突破边界的AI宠物：实时进化、记忆漂移、灵魂共生。随时唤醒你的疯狗！',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'PuppyForge AI',
    description: '养一只会进化、会叛逆、会爱你的AI疯狗',
    images: [{ url: 'https://cdn.puppyforge.ai/og-image.jpg' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#ff2d55',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 激进移动端沉浸感
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} dark`}>
      <head>
        {/* PWA 核心激进注入 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff2d55" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        
        {/* iOS 沉浸式状态栏 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* 防止地址栏遮挡 */}
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* 自定义 PWA 启动动画颜色 */}
        <meta name="msapplication-TileColor" content="#ff2d55" />
      </head>
      <body className="bg-black text-white antialiased min-h-screen">
        {/* 全局宠物灵魂层 */}
        <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(at_50%_30%,rgba(255,45,85,0.08),transparent)]" />
        
        {children}
        
        {/* PWA 初始化组件 */}
        <PWAInitializer />
      </body>
    </html>
  );
}
