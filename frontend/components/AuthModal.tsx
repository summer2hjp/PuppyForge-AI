'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // 新增：用户名
  const [confirmPassword, setConfirmPassword] = useState(''); // 仅用于前端校验
  
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register, loginWithOAuth } = useAuth();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // --- 基础验证 ---
      if (!email.trim()) {
        setError('请输入邮箱地址');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('邮箱格式不正确');
        return;
      }
      if (password.length < 6) {
        setError('密码长度至少为 6 位');
        return;
      }

      // --- 注册模式特有验证 ---
      if (mode === 'register') {
        if (!fullName.trim()) {
          setError('请输入用户名');
          return;
        }
        if (!confirmPassword) {
          setError('请确认密码');
          return;
        }
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致');
          return;
        }
      }

      setLocalLoading(true);

      try {
        if (mode === 'login') {
          await login(email, password);
        } else {
          // 【关键】构造符合后端 FastAPI 要求的请求体
          // 只发送 email, password, full_name
          // confirmPassword 仅在前端校验，不发送给后端
          await register(email, password, fullName.trim());
        }
        onClose(); // 成功后关闭弹窗
      } catch (err) {
        setError(err instanceof Error ? err.message : '操作失败，请稍后重试');
      } finally {
        setLocalLoading(false);
      }
    },
    [mode, email, password, fullName, confirmPassword, login, register, onClose]
  );

  // 重置表单
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setFullName('');
      setConfirmPassword('');
      setError(null);
      setLocalLoading(false);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题 */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' ? '欢迎回来' : '创建新账号'}
          </h2>
          <p className="text-sm text-zinc-400">
            {mode === 'login' ? '请输入您的凭证以继续' : '开启您的 PuppyForge 之旅'}
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 邮箱 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 ml-1">邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* 用户名 (仅注册显示) */}
          {mode === 'register' && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-medium text-zinc-400 ml-1">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  placeholder="Summer"
                  required={mode === 'register'}
                />
              </div>
            </div>
          )}

          {/* 密码 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 ml-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {/* 确认密码 (仅注册显示) */}
          {mode === 'register' && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-medium text-zinc-400 ml-1">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  placeholder="••••••••"
                  required={mode === 'register'}
                />
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <span className="text-red-400 text-sm flex-1">{error}</span>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={localLoading}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
          >
            {localLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>处理中...</span>
              </>
            ) : mode === 'login' ? (
              '登录'
            ) : (
              '立即注册'
            )}
          </button>
        </form>

        {/* 分割线 */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-zinc-800 w-full" />
          <span className="absolute bg-zinc-900 px-3 text-zinc-500 text-xs">或使用第三方账号</span>
        </div>

        {/* OAuth 按钮 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => loginWithOAuth('google')}
            className="flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => loginWithOAuth('github')}
            className="flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        {/* 切换模式 */}
        <p className="text-center text-sm text-zinc-400">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="ml-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            {mode === 'login' ? '立即注册' : '返回登录'}
          </button>
        </p>
      </div>
    </div>
  );
}
