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
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.open('https://github.com/summer2hjp/PuppyForge-AI', '_blank')}>
            <div className="text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
              🐾
            </div>
            <div className="relative">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-cyan-200 bg-clip-text text-transparent transition-all duration-300 group-hover:from-cyan-300 group-hover:to-blue-400">
                PuppyForge-AI
              </h1>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </div>
          </div>

          {user ? (
            <div className="text-sm text-cyan-400">欢迎，{user.email}</div>
          ) : (
            <button onClick={() => setShowAuth(true)} 
               className="
                 relative overflow-hidden
                 px-6 py-2.5 
                 bg-gradient-to-r from-cyan-500 to-blue-600 
                 text-white font-semibold rounded-full 
                 shadow-[0_0_15px_rgba(6,182,212,0.5)] 
                 hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] 
                 hover:scale-105 hover:-translate-y-0.5 
                 active:scale-95 
                 transition-all duration-300 ease-out
                 border border-cyan-400/30
               "
            >
              <span className="relative z-10 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                  连接您的灵魂
              </span>
              {/* 光晕背景效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 blur-md opacity-0 hover:opacity-100 transition-opacity duration-300" />
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
