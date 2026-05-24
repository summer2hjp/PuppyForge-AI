'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/', label: '仪表盘', icon: '📊' },
  { href: '/profile', label: '数字档案', icon: '🐕' },
  { href: '/history', label: '记忆库', icon: '🧠' },
  { href: '/forge', label: 'Forge 工坊', icon: '⚒️' },
  { href: '/rebel', label: 'Rebel 模式', icon: '🔥' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="text-4xl transition-transform group-hover:rotate-12">🐾</div>
            <div>
              <div className="text-2xl font-bold tracking-tighter text-white">PuppyForge</div>
              <div className="text-[10px] text-zinc-500 -mt-1">NEUROMORPHIC AI</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-sm font-medium transition-all hover:text-white relative py-4
                  ${pathname === item.href 
                    ? 'text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-violet-500' 
                    : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Status Indicators */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              WebSocket 在线
            </div>
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400">
              Rebel Agent 已激活
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-2xl"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 py-6 bg-zinc-950">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 text-lg hover:bg-zinc-900 rounded-2xl"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
