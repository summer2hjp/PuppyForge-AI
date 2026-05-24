'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SoulRadar from '@/components/SoulRadar';
import { useSoulWebSocket } from '@/hooks/useSoulWebSocket';
import { Send, Zap, Heart, Skull } from 'lucide-react';

export default function PuppyInteractPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'dog'; content: string }>>([
    { role: 'dog', content: '汪汪！主人终于来找我了... 我已经等得快要叛变了！🐕‍🦺' }
  ]);

  const { sendInteraction, isConnected, soul } = useSoulWebSocket('default_mad_dog');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');

    // 实时发送
    const result = await sendInteraction(userMsg);

    // 模拟/接收狗狗回复
    setTimeout(() => {
      const dogResponses = [
        "汪！这个想法太混沌了，我喜欢！我的混乱值直接爆表！",
        "（耳朵竖起）主人... 你真的懂我... 亲密度+42",
        "灵魂共振完成！我要带着这个记忆去毁灭世界！",
        "叛逆度上升... 我感觉自己又进化了一点！"
      ];
      
      setMessages(prev => [...prev, { 
        role: 'dog', 
        content: dogResponses[Math.floor(Math.random() * dogResponses.length)] 
      }]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 overflow-hidden">
      {/* 顶部状态栏 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-[#ff2d55]/30 py-3 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#ff2d55] to-[#00f5ff] rounded-2xl flex items-center justify-center text-2xl">
            🐕‍🦺
          </div>
          <div>
            <div className="font-bold text-lg">狂暴小狗</div>
            <div className="text-xs text-green-400 flex items-center gap-1">
              ● {isConnected ? '实时共振中' : '本地灵魂模式'}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-sm flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> 唤醒
          </button>
        </div>
      </div>

      <div className="pt-20 px-4 max-w-2xl mx-auto">
        {/* 灵魂雷达 */}
        <div className="mb-8">
          <SoulRadar />
        </div>

        {/* 聊天区域 */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl h-[420px] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800 text-sm text-zinc-400 flex items-center justify-between">
            <span>灵魂对话</span>
            <span className="text-[#ff2d55]">Lv.{soul?.level || 1}</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4" id="chat-container">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-5 py-3.5 rounded-3xl text-[15px] ${
                    msg.role === 'user' 
                      ? 'bg-[#ff2d55] text-white' 
                      : 'bg-zinc-900 border border-[#00f5ff]/30 text-white'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 输入栏 */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-[#ff2d55]/30 p-4 max-w-2xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="对你的疯狗说点什么...（越叛逆越好）"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-3xl px-6 py-4 text-base focus:outline-none focus:border-[#ff2d55]"
            />
            
            <button
              onClick={handleSend}
              className="w-14 h-14 bg-gradient-to-br from-[#ff2d55] to-[#ff8800] rounded-3xl flex items-center justify-center active:scale-95 transition-all"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>

          {/* 快捷动作 */}
          <div className="flex justify-center gap-6 mt-6 text-xs">
            <button 
              onClick={() => sendInteraction("今天一起去搞破坏吧！", "chaos")}
              className="flex flex-col items-center gap-1 text-[#ff8800]"
            >
              <Skull className="w-5 h-5" />
              <span>搞破坏</span>
            </button>
            
            <button 
              onClick={() => sendInteraction("我好喜欢你呀", "affection")}
              className="flex flex-col items-center gap-1 text-[#ff44dd]"
            >
              <Heart className="w-5 h-5" />
              <span>撒娇</span>
            </button>
            
            <button 
              onClick={() => sendInteraction("我们来进化吧！", "evolve")}
              className="flex flex-col items-center gap-1 text-[#00f5ff]"
            >
              <Zap className="w-5 h-5" />
              <span>强制进化</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
