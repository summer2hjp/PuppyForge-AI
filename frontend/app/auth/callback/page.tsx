'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在同步灵魂数据...');

  useEffect(() => {
    // ═══ 情况 A: GitHub 直接回调到前端 (URL 中有 ?code=xxx) ═══
    const code = searchParams.get('code');
    if (code) {
      setMessage('正在验证 GitHub 授权...');
      const state = searchParams.get('state') || '';

      fetch(`/api/auth/github-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.token) {
            setStatus('error');
            setMessage(`认证失败: ${data.message || '未知错误'}`);
            return;
          }
          useAuth.setState({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            loading: false,
            error: null,
          });
          setStatus('success');
          setMessage('登录成功，正在跳转...');
          window.history.replaceState({}, document.title, '/');
          setTimeout(() => router.push('/'), 1000);
        })
        .catch((err) => {
          console.error('OAuth proxy error:', err);
          setStatus('error');
          setMessage('网络错误，请重试');
        });
      return;
    }

    // ═══ 情况 B: 后端重定向回来 (URL hash 中有 #token=xxx) ═══
    const hash = window.location.hash.substring(1);
    if (!hash) {
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
      const params = new URLSearchParams(hash);
      const token = params.get('token');
      const refreshToken = params.get('refreshToken');
      const userStr = params.get('user');

      if (!token || !userStr) {
        throw new Error('缺少关键认证信息');
      }

      const user = JSON.parse(decodeURIComponent(userStr));

      useAuth.setState({
        user,
        token,
        refreshToken,
        loading: false,
        error: null,
      });

      setStatus('success');
      setMessage('登录成功，正在跳转...');
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
