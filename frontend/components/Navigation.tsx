'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '仪表盘' },
  { href: '/profile', label: '宠物档案' },
  { href: '/history', label: '记忆历史' },
  { href: '/forge', label: 'Forge 工坊' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">🐾</span>
            <span className="font-bold text-2xl tracking-tighter">PuppyForge</span>
          </Link>

          <div className="flex gap-8 text-sm">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition hover:text-white ${pathname === item.href ? 'text-white font-medium' : 'text-zinc-400'}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
            神经引擎在线
          </div>
        </div>
      </div>
    </nav>
  );
}
