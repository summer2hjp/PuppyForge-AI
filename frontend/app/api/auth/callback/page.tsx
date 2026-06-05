'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setState } = useAuth(); // 使用 Zustand 的 setState
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在同步灵魂数据...');

  useEffect(() => {
    // 1. 从 URL Hash 中获取数据 (格式: #token=xxx&refreshToken=xxx&user={...})
    const hash = window.location.hash.substring(1); // 去掉 #
    if (!hash) {
      // 如果没有 hash，检查是否有 error 参数
      const error = searchParams.get('error');
      if (error) {
        setStatus('error');
        setMessage(`认证失败: ${error}`);
        return;
      }
      setStatus('error');
      setMessage('无效的认证链接');
      return;
    }

    try {
      // 2. 解析 Hash 参数
      const params = new URLSearchParams(hash);
      const token = params.get('token');
      const refreshToken = params.get('refreshToken');
      const userStr = params.get('user');

      if (!token || !userStr) {
        throw new Error('缺少关键认证信息');
      }

      // 3. 解析用户对象
      const user = JSON.parse(decodeURIComponent(userStr));

      // 4. 更新全局状态 (模拟登录成功)
      useAuth.setState({
        user,
        token,
        refreshToken,
        loading: false,
        error: null,
      });

      setStatus('success');
      setMessage('登录成功，正在跳转...');

      // 5. 清理 URL 并跳转首页
      // 使用 replaceState 清除 hash，避免刷新时重复处理
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (err) {
      console.error('OAuth Callback Error:', err);
      setStatus('error');
      setMessage('解析认证信息失败，请重试');
    }
  }, [searchParams, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
      <div className="text-center space-y-4 max-w-md px-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto" />
            <h2 className="text-xl font-semibold">正在连接 {searchParams.get('provider') || '第三方'} 账号...</h2>
            <p className="text-zinc-400">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">认证成功!</h2>
            <p className="text-zinc-400">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold">认证失败</h2>
            <p className="text-red-400">{message}</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              返回首页
            </button>
          </>
        )}
      </div>
    </div>
  );
}
