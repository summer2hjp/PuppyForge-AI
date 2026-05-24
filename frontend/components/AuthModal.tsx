'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-8 rounded-3xl w-full max-w-md border border-cyan-500/30">
        <h2 className="text-3xl font-bold mb-8 text-center">
          {mode === 'login' ? '灵魂连接' : '创造新灵魂'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-white/20 rounded-2xl px-5 py-4"
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-white/20 rounded-2xl px-5 py-4"
            required
          />

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-bold hover:scale-105 transition-transform"
          >
            {mode === 'login' ? '连接灵魂' : '注册账号'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-zinc-400">
          {mode === 'login' ? "没有账号？" : "已有账号？"}
          <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-cyan-400 cursor-pointer hover:underline">
            {mode === 'login' ? '立即注册' : '返回登录'}
          </span>
        </p>
      </div>
    </motion.div>
  );
}
