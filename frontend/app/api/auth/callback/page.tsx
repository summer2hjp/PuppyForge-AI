'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setState } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        // 更新全局状态
        useAuth.setState({
          token,
          refreshToken,
          user,
          loading: false
        });
        // 清理 URL 并跳转
        window.history.replaceState({}, document.title, '/');
        router.push('/');
      } catch (e) {
        setError('解析用户信息失败');
      }
    } else {
      setError('认证信息缺失');
      setTimeout(() => router.push('/'), 2000);
    }
  }, [searchParams, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
      {error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p>正在同步灵魂数据...</p>
        </div>
      )}
    </div>
  );
}
