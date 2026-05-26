// ✅ 修复后完整代码
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PWAInitializer from '@/components/PWAInitializer';

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
  userScalable: false,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* PWA 核心激进注入 */}
        <PWAInitializer />
        
        {/* iOS 沉浸式状态栏 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* 防止地址栏遮挡 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* 自定义 PWA 启动动画颜色 */}
        <meta name="theme-color" content="#ff2d55" />
        
        {/* 全局宠物灵魂层 */}
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-purple-900 to-zinc-900">
          {children}
        </div>
      </body>
    </html>
  );
}
