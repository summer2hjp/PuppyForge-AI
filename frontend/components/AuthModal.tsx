'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, loginWithOAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await login(email, password);
    } else {
      await register(email, password);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]"
    >
      <div className="bg-zinc-900 border border-cyan-500/30 rounded-3xl w-full max-w-md p-10">
        <h2 className="text-3xl font-bold text-center mb-8">
          {mode === 'login' ? '连接你的灵魂' : '创造新灵魂'}
        </h2>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => loginWithOAuth('google')}
            className="flex-1 py-3 bg-white text-black rounded-2xl font-medium hover:bg-gray-200"
          >
            Google
          </button>
          <button 
            onClick={() => loginWithOAuth('github')}
            className="flex-1 py-3 bg-black border border-white rounded-2xl font-medium hover:bg-zinc-800"
          >
            GitHub
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="邮箱地址"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-white/20 rounded-2xl px-5 py-4 focus:border-cyan-400 outline-none"
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-white/20 rounded-2xl px-5 py-4 focus:border-cyan-400 outline-none"
            required
          />

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-bold text-lg hover:scale-105 transition-transform"
          >
            {mode === 'login' ? '立即连接' : '创建账号'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-zinc-400">
          {mode === 'login' ? "还没有账号？" : "已有账号？"}
          <span 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-cyan-400 cursor-pointer hover:underline ml-1"
          >
            {mode === 'login' ? '立即注册' : '返回登录'}
          </span>
        </p>
      </div>
    </motion.div>
  );
}
