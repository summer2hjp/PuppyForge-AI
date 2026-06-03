'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Send, Zap, X } from 'lucide-react';

// 动态导入 SoulRadar，禁用 SSR 以避免 hydration 错误
const SoulRadar = dynamic(() => import('@/components/SoulRadar'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-zinc-900/50 rounded-2xl border border-white/10">
      <div className="text-cyan-400 animate-pulse flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span>正在连接灵魂网络...</span>
      </div>
    </div>
  )
});

export default function PuppyForgeDashboard() {
  const { user, loginWithOAuth } = useAuth();
  const [soulId] = useState("summer2hjp-001");
  const [userInput, setUserInput] = useState("");
  const [interactionLog, setInteractionLog] = useState<string[]>([
    "系统已启动，Summer 的灵魂正在苏醒...",
  ]);
  const [showAuth, setShowAuth] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // 自动滚动到底部
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactionLog]);

  const handleSend = async () => {
    if (!userInput.trim() || isSending) return;
    
    const message = userInput.trim();
    setInteractionLog(prev => [...prev, `你: ${message}`]);
    setUserInput("");
    setIsSending(true);

    // 模拟异步响应 (实际应调用 API)
    setTimeout(() => {
      setInteractionLog(prev => [...prev, `AI: 收到指令 "${message}"，灵魂能量波动正常。`]);
      setIsSending(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* 导航栏 */}
      <nav className="shrink-0 border-b border-white/10 bg-black/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div 
            className="flex items-center gap-4 group cursor-pointer" 
            onClick={() => window.open('https://github.com/summer2hjp/PuppyForge-AI', '_blank')}
          >
            <div className="text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
              🐾
            </div>
            <div className="relative">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-cyan-200 bg-clip-text text-transparent transition-all duration-300 group-hover:from-cyan-300 group-hover:to-blue-400">
                PuppyForge-AI
              </h1>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </div>
          </div>

          {user ? (
            <div className="text-xs sm:text-sm text-cyan-400 font-medium bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-500/20">
              {user.email}
            </div>
          ) : (
            <button 
              onClick={() => setShowAuth(true)} 
              className="
                relative overflow-hidden
                px-4 sm:px-6 py-2 
                bg-gradient-to-r from-cyan-500 to-blue-600 
                text-white font-semibold rounded-full 
                shadow-[0_0_15px_rgba(6,182,212,0.5)] 
                hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] 
                hover:scale-105 active:scale-95 
                transition-all duration-300 ease-out
                border border-cyan-400/30
                text-sm sm:text-base
              "
            >
              <span className="relative z-10 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                连接灵魂
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* 主内容区：SoulRadar */}
      <main className="flex-1 relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col min-h-0">
        <div className="flex-1 relative w-full h-full min-h-[400px]">
          <SoulRadar soulId={soulId} />
        </div>
      </main>

      {/* 底部交互区：日志 + 输入框 */}
      <footer className="shrink-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-2">
        {/* 日志区域 (可选，如果不需要可隐藏) */}
        <div className="h-24 mb-4 overflow-y-auto bg-zinc-900/50 rounded-xl border border-white/5 p-3 text-xs sm:text-sm text-zinc-400 font-mono scrollbar-thin scrollbar-thumb-zinc-700">
          {interactionLog.map((log, i) => (
            <div key={i} className="mb-1 last:mb-0">{log}</div>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* 输入框 */}
        <div className="relative flex items-end gap-2 bg-zinc-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-lg focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="与灵魂对话..."
            disabled={isSending || !user}
            rows={1}
            className="w-full bg-transparent border-0 text-white placeholder-zinc-500 focus:ring-0 resize-none py-3 px-3 max-h-32 min-h-[44px] scrollbar-none"
            style={{ height: 'auto', minHeight: '44px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!userInput.trim() || isSending || !user}
            className="mb-1 p-3 rounded-xl bg-cyan-600 text-white disabled:bg-zinc-800 disabled:text-zinc-600 hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {!user && (
          <div className="text-center mt-2 text-xs text-zinc-500">
            请先连接灵魂以启用交互功能
          </div>
        )}
      </footer>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
