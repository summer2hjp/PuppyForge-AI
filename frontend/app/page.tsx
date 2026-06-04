'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { Send, Zap, AlertCircle, Loader2, LogOut, X } from 'lucide-react';

// 动态导入 SoulRadar (禁用 SSR 以避免 hydration 错误)
const SoulRadar = dynamic(() => import('@/components/SoulRadar'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-zinc-900/50 rounded-2xl border border-white/10">
      <div className="text-cyan-400 animate-pulse flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span>正在初始化灵魂核心...</span>
      </div>
    </div>
  )
});

// 消息类型定义
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export default function PuppyForgeDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, logout, setUser, login } = useAuth();
  
  // 状态管理
  const [soulId, setSoulId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // --- 1. OAuth 回调处理 ---
  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams) {
      const urlToken = searchParams.get('token');
      const urlRefreshToken = searchParams.get('refreshToken');
      const urlUserStr = searchParams.get('user');

      if (urlToken && urlUserStr) {
        setIsProcessingOAuth(true);
        try {
          const urlUser = JSON.parse(decodeURIComponent(urlUserStr));
          // 更新 Zustand 状态
          useAuth.setState({ 
            user: urlUser, 
            token: urlToken, 
            refreshToken: urlRefreshToken,
            loading: false 
          });
          // 清理 URL 参数
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsProcessingOAuth(false);
        } catch (e) {
          console.error('OAuth 解析失败', e);
          setWsError('登录信息解析失败，请重试');
          setIsProcessingOAuth(false);
        }
      }
    }
  }, [searchParams]);

  // --- 2. 初始化 Soul ID 和欢迎语 ---
  useEffect(() => {
    if (user) {
      // 生成 Soul ID
      const userIdStr = user.id ? String(user.id) : '0000';
      const generatedSoulId = `${user.email.split('@')[0]}-${String(user.id).slice(-4) || '001'}`;
      setSoulId(generatedSoulId);

      // 添加欢迎语
        setMessages([
          {
            id: 'init-1',
            role: 'system',
            content: `系统已启动。欢迎回来，${user.name || user.email}。你的灵魂 (${generatedSoulId}) 正在同步中...`,
            timestamp: new Date().toISOString()
          }
        ]);
    } else {
      setSoulId(null);
      // 未登录时不清空消息历史，以便用户登录后查看，或者根据需求清空
      // setMessages([]); 
      setIsConnected(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
  }, [user]);

  // --- 3. WebSocket 连接管理 ---
  useEffect(() => {
    if (!user || !token || !soulId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // 注意：这里假设后端 WS 地址，根据实际情况调整 host
        // 生产环境建议配置 NEXT_PUBLIC_WS_URL
        const wsHost = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
        const wsUrl = `${protocol}//${wsHost}/api/v1/ws?soul_id=${soulId}&token=${token}`;
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('✅ WebSocket Connected');
          setIsConnected(true);
          setWsError(null);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message' || data.type === 'response') {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.content || data.text,
                timestamp: new Date().toISOString()
              }]);
            } else if (data.type === 'error') {
              setWsError(data.message);
            } else if (data.type === 'ping') {
               ws.send(JSON.stringify({ type: 'pong' }));
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        };

        ws.onclose = () => {
          console.log('❌ WebSocket Disconnected');
          setIsConnected(false);
          // 可选：实现指数退避重连逻辑
        };

        ws.onerror = (error) => {
          console.error('WebSocket Error:', error);
          setWsError('连接服务器失败，请检查网络');
          setIsConnected(false);
        };

        wsRef.current = ws;
      } catch (err) {
        setWsError('无法建立连接');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, token, soulId]);

  // --- 4. 发送消息逻辑 ---
  const handleSend = async () => {
    if (!inputValue.trim() || isSending || !wsRef.current || !isConnected) return;

    const text = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: text,
        soul_id: soulId
      }));
    } catch (error) {
      setWsError('发送失败，请重试');
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        role: 'system',
        content: '消息发送失败，连接可能已断开。',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`;
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden font-sans">
      {/* --- 导航栏 --- */}
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

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-xs font-medium bg-cyan-950/30 px-3 py-1.5 rounded-full border border-cyan-500/20 text-cyan-300">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  {isConnected ? '在线' : '连接中...'}
                </div>
                <button 
                  onClick={logout}
                  className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                  title="断开连接"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">退出</span>
                </button>
              </>
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
        </div>
      </nav>

      {/* --- 主内容区：SoulRadar (始终渲染) --- */}
      <main className="flex-1 relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col min-h-0">
        <div className="flex-1 relative w-full h-full min-h-[300px] sm:min-h-[400px]">
          {isProcessingOAuth ? (
             <div className="w-full h-full flex items-center justify-center bg-zinc-900/30 rounded-2xl border border-dashed border-cyan-500/30">
               <div className="flex flex-col items-center gap-3 text-cyan-400">
                 <Loader2 className="w-8 h-8 animate-spin" />
                 <span>正在同步灵魂数据...</span>
               </div>
             </div>
          ) : (
            <SoulRadar soulId={soulId} />
          )}
        </div>
      </main>

      {/* --- 底部交互区 --- */}
      <footer className="shrink-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-2">
        {/* 错误提示 */}
        {wsError && (
          <div className="mb-3 p-3 bg-red-950/50 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{wsError}</span>
            <button onClick={() => setWsError(null)} className="ml-auto hover:text-white">×</button>
          </div>
        )}

        {/* 消息日志 */}
        <div className="h-32 mb-4 overflow-y-auto bg-zinc-900/50 rounded-xl border border-white/5 p-4 text-xs sm:text-sm font-mono space-y-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="text-zinc-600 text-center mt-10">
              {user ? '等待指令...' : '请先连接灵魂以激活对话'}
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 rounded-lg ${
                  msg.role === 'user' ? 'bg-cyan-900/30 text-cyan-100 border border-cyan-500/20' : 
                  msg.role === 'system' ? 'bg-zinc-800/50 text-zinc-400 border border-zinc-700' :
                  'bg-zinc-800/80 text-zinc-200 border border-white/5'
                }`}>
                  <span className="opacity-50 text-[10px] block mb-1">{msg.role.toUpperCase()}</span>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className={`relative flex items-end gap-2 bg-zinc-900/80 backdrop-blur-md p-2 rounded-2xl border transition-all duration-300 ${
          !user ? 'border-zinc-800 opacity-60 grayscale' : 
          isConnected ? 'border-white/10 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 shadow-lg' : 
          'border-yellow-500/30'
        }`}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={user ? (isConnected ? "与灵魂对话..." : "连接中，请稍候...") : "请先连接灵魂"}
            disabled={!user || !isConnected || isSending || isProcessingOAuth}
            rows={1}
            className="w-full bg-transparent border-0 text-white placeholder-zinc-500 focus:ring-0 resize-none py-3 px-3 max-h-32 min-h-[44px] scrollbar-none disabled:cursor-not-allowed"
            style={{ height: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || !user || !isConnected || isProcessingOAuth}
            className="mb-1 p-3 rounded-xl bg-cyan-600 text-white disabled:bg-zinc-800 disabled:text-zinc-600 hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* 优化后的未登录提示 */}
        {!user && !isProcessingOAuth && (
          <div className="mt-3 flex justify-center">
            <div 
              onClick={() => setShowAuth(true)}
              className="
                group flex items-center gap-2 
                px-4 py-2 
                bg-zinc-900/50 hover:bg-zinc-800/80 
                border border-zinc-700 hover:border-cyan-500/50 
                rounded-full 
                cursor-pointer 
                transition-all duration-300 
                hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]
                hover:-translate-y-0.5
              "
            >
              <div className="w-2 h-2 rounded-full bg-zinc-500 group-hover:bg-cyan-400 transition-colors animate-pulse" />
              <span className="text-xs text-zinc-400 group-hover:text-cyan-300 font-medium">
                未检测到灵魂连接，请点击此处激活
              </span>
              <Zap className="w-3 h-3 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>
        )}
      </footer>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
