'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function AuthCallbackContent() {
  const goHome = () => window.location.replace('/');
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在同步灵魂数据...');
  const [tick, setTick] = useState(0);  // 触发重渲染以重读 hash
  const retries = useRef(0);

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
          setTimeout(() => goHome(), 800);
        })
        .catch((err) => {
          console.error('OAuth proxy error:', err);
          setStatus('error');
          setMessage('网络错误，请重试');
        });
      return;
    }

    // ═══ 情况 B: 后端重定向回来 (URL hash 中有 #token=xxx) ═══
    // 用 rAF 确保浏览器已完成 URL 解析
    const raf = requestAnimationFrame(() => {
      const hash = window.location.hash.substring(1);

      // 检查 error 参数
      const error = searchParams.get('error');
      if (error) {
        setStatus('error');
        setMessage(`认证失败: ${error}`);
        return;
      }

      // hash 空 + 有 provider → 等待浏览器完成 hash 解析
      if (!hash && searchParams.get('provider')) {
        if (retries.current < 15) {
          retries.current++;
          const timer = setTimeout(() => setTick((t) => t + 1), 300);
          return () => clearTimeout(timer);
        }
        // 重试耗尽 → 静默跳回首页
        goHome();
        return;
      }

      // 既无 hash 也无 provider → 静默跳回首页
      if (!hash) {
        goHome();
        return;
      }

      // 解析 hash
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
        setTimeout(() => goHome(), 800);
      } catch (err) {
        console.error('OAuth Callback Error:', err);
        setStatus('error');
        setMessage('解析认证信息失败，请重试');
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [searchParams, tick]);

  const providerLabel = searchParams.get('provider') || '第三方';

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
      <div className="text-center space-y-4 max-w-md px-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">
              正在连接 {providerLabel} 账号...
            </h2>
            <p className="text-zinc-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-white">认证成功!</h2>
            <p className="text-zinc-400">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-white">认证失败</h2>
            <p className="text-red-400">{message}</p>
            <button
              onClick={() => goHome()}
              className="mt-4 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-white"
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
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto" />
          <h2 className="text-xl font-semibold text-white">正在同步灵魂数据...</h2>
          <p className="text-zinc-400">即将完成认证</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
