// app/not-found.tsx
'use client'; // 如果需要客户端交互（可选）

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        404
      </h1>
      <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-6">
        页面走丢了 🐕‍🦺
      </h2>
      <p className="text-gray-500 dark:text-gray-500 mb-8 max-w-md">
        你寻找的宠物记忆可能已被宇宙黑洞吞噬，或链接已失效。
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}
