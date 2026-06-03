'use client';

import React, { useState } from 'react';
// 1. 引入 dynamic
import dynamic from 'next/dynamic';

//import SoulRadar from '@/components/SoulRadar';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Send, Zap } from 'lucide-react';

// 2. 动态导入 SoulRadar，禁用 SSR
const SoulRadar = dynamic(() => import('@/components/SoulRadar'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center bg-zinc-900/50 rounded-xl border border-white/10">
      <div className="text-cyan-400 animate-pulse">正在连接灵魂网络...</div>
    </div>
  )
});

export default function PuppyForgeDashboard() {
  const { user, loginWithOAuth } = useAuth();
  const [soulId] = useState("Summer520");
  const [userInput, setUserInput] = useState("");
  const [interactionLog, setInteractionLog] = useState<string[]>([
    "系统已启动，Summer520的灵魂正在苏醒...",
  ]);
  const [showAuth, setShowAuth] = useState(false);

  const handleSend = () => {
    if (!userInput.trim()) return;
    setInteractionLog(prev => [...prev, `你: ${userInput}`]);
    setUserInput("");
    // WebSocket 发送逻辑在 SoulRadar 中处理
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="fixed top-0 w-full border-b border-white/10 bg-black/90 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🐾</div>
            <div>
              <h1 className="text-2xl font-bold">PuppyForge-AI</h1>
              <p className="text-xs text-cyan-400">AI Soul Engine v1.0</p>
            </div>
          </div>

          {user ? (
            <div className="text-sm text-cyan-400">欢迎，{user.email}</div>
          ) : (
            <button onClick={() => setShowAuth(true)} className="px-6 py-2 bg-white text-black rounded-full font-medium">
            连接您的灵魂
            </button>
          )}
        </div>
      </nav>

      <div className="pt-24 max-w-7xl mx-auto px-8">
        <SoulRadar soulId={soulId} />
      </div>
      
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
