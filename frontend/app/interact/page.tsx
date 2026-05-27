// ========================================
// 互动页面 - 实时灵魂共振
// ========================================

'use client';

import { useState } from 'react';
import { Send, Zap, Heart, Sparkles } from 'lucide-react';
import { useSoulWebSocket } from '@/hooks/usePuppySoul';  // ✅ 使用统一 Hook
import SoulRadar from '@/components/SoulRadar';

export default function InteractPage() {
  const [input, setInput] = useState('');
  // ✅ 修复：useSoulWebSocket 第一个参数是 soulId 字符串，第二个是可选配置对象
  const { sendInteraction, isConnected, soul } = useSoulWebSocket('default_mad_dog');

  const handleSend = () => {
    if (!input.trim() || !isConnected) return;
    // ✅ 修复：sendInteraction 只接受 1 个参数（userInput）
    sendInteraction(input);
    setInput('');
  };

  const handleQuickAction = (message: string) => {
    // ✅ 修复：只传 1 个参数
    sendInteraction(message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950 to-zinc-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 头部 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            🐕‍🦺 灵魂共振实验室
          </h1>
          <p className="text-zinc-400">
            与你的数字宠物进行实时心灵对话
          </p>
        </div>

        {/* 灵魂雷达 */}
        {/* ✅ 修复：SoulRadar 需要 soulId prop */}
        <SoulRadar soulId="default_mad_dog" />

        {/* 灵魂状态 */}
        {soul && (
          <div className="p-6 bg-zinc-900/50 border border-purple-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{soul.name}</h3>
                {/* ✅ 修复：使用 snake_case 字段 + 兼容 getter */}
                <p className="text-zinc-400 text-sm">
                  阶段: {soul.evolution_stage || soul.evolutionStage || 'puppy'} 
                  {' • '} 
                  {/* ✅ 修复：使用 total_interactions 或兼容字段 */}
                  共振: {soul.total_interactions || soul.totalInteractions || 0} 次
                </p>
              </div>
              {/* ✅ 修复：使用兼容的 level getter */}
              <span className="text-[#ff2d55] font-bold">
                Lv.{soul.level || 1}
              </span>
            </div>
            
            <div className="flex gap-2">
              {soul.personality_traits?.slice(0, 3).map((trait: string) => (
                <span 
                  key={trait}
                  className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 快捷操作 */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleQuickAction("今天一起去搞破坏吧！")}  // ✅ 修复：只传 1 个参数
            className="p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-300 transition flex flex-col items-center gap-2"
          >
            <Zap className="w-6 h-6" />
            <span className="text-sm">搞破坏</span>
          </button>
          
          <button
            onClick={() => handleQuickAction("我好喜欢你呀")}  // ✅ 修复：只传 1 个参数
            className="p-4 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 rounded-xl text-pink-300 transition flex flex-col items-center gap-2"
          >
            <Heart className="w-6 h-6" />
            <span className="text-sm">表达爱</span>
          </button>
          
          <button
            onClick={() => handleQuickAction("我们来进化吧！")}  // ✅ 修复：只传 1 个参数
            className="p-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-xl text-cyan-300 transition flex flex-col items-center gap-2"
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-sm">促进化</span>
          </button>
        </div>

        {/* 聊天输入 */}
        <div className="p-6 bg-zinc-900/50 border border-zinc-700 rounded-2xl">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isConnected ? "输入你想对宠物说的话..." : "等待连接..."}
              disabled={!isConnected}
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!isConnected || !input.trim()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 rounded-xl text-white font-medium transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              发送
            </button>
          </div>
          
          {!isConnected && (
            <p className="mt-3 text-sm text-yellow-400 flex items-center gap-2">
              <span className="animate-pulse">●</span>
              正在连接灵魂网络...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
