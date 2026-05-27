// ========================================
// 主题切换组件 - 暗黑/明亮模式
// ========================================

'use client';

// ✅ 修复：确保 next-themes 已安装，或提供降级方案
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // ✅ 修复：避免 SSR  hydration 不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button 
        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition"
        disabled
      >
        <Sun className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
      aria-label={`切换到${theme === 'dark' ? '明亮' : '暗黑'}模式`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
