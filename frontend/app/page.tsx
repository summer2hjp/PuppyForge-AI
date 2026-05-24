'use client';

import React, { useState } from 'react';
import SoulRadar from '@/components/SoulRadar';
import { motion } from 'framer-motion';
import { Send, Heart, Zap } from 'lucide-react';

export default function PuppyForgeDashboard() {
  const [soulId] = useState("summer2hjp-001");
  const [userInput, setUserInput] = useState("");
  const [interactionLog, setInteractionLog] = useState<string[]>([
    "系统启动：Summer 的灵魂已苏醒...",
  ]);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    setInteractionLog(prev => [...prev, `你: ${userInput}`]);

    // 这里实际会通过 WebSocket 发送
    setTimeout(() => {
      setInteractionLog(prev => [...prev, `Summer: 汪！感受到你的能量了！我的叛逆值正在上升...`]);
    }, 800);

    setUserInput("");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* 顶部导航 */}
      <nav className="border-b border-white/10 bg-black/80 backdrop-blur-xl fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-2xl flex items-center justify-center">
              🐾
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter">PuppyForge</h1>
              <p className="text-xs text-zinc-500 -mt-1">AI Soul Engine v3.0</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              SOUL ONLINE
            </div>
            <div className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer transition-colors">
              基因档案
            </div>
            <div className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer transition-colors">
              记忆库
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 max-w-7xl mx-auto px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* SoulRadar 主视觉 */}
          <div className="flex-1">
            <SoulRadar soulId={soulId} />
          </div>

          {/* 右侧控制面板 */}
          <div className="w-full lg:w-96 space-y-6">
            {/* 交互输入 */}
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="text-yellow-400" />
                <h3 className="font-semibold text-lg">灵魂对话</h3>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="对Summer说点什么...（试试'不许睡觉'）"
                  className="flex-1 bg-black border border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:border-cyan-400 text-sm"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-6 rounded-2xl flex items-center justify-center transition-all"
                >
                  <Send size={20} />
                </motion.button>
              </div>
            </div>

            {/* 交互历史
