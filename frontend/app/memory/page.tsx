'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePuppySoul } from '@/hooks/usePuppySoul';
import { Calendar, Flame, Heart, Zap, Clock } from 'lucide-react';

export default function MemoryArchivePage() {
  const { soul, getRecentMemories } = usePuppySoul('default_mad_dog');
  const [memories, setMemories] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'interaction' | 'evolution'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadMemories = async () => {
      const data = await getRecentMemories(50);
      setMemories(data);
    };
    loadMemories();
  }, [getRecentMemories]);

  const filteredMemories = memories
    .filter(m => filter === 'all' || m.type === filter)
    .filter(m => m.content.toLowerCase().includes(search.toLowerCase()));

  const totalImpact = memories.reduce((sum, m) => sum + m.impact, 0);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* 顶部导航 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-[#ff2d55]/30 py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📜</div>
            <div>
              <div className="font-bold text-2xl tracking-tighter">记忆档案</div>
              <div className="text-xs text-zinc-500">灵魂黑匣子 · 永不删除</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#ff2d55]">Lv.{soul?.level || 1}</div>
            <div className="text-xs text-zinc-400">{soul?.totalInteractions || 0} 次共振</div>
          </div>
        </div>
      </div>

      <div className="pt-24 max-w-3xl mx-auto px-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center">
            <div className="text-4xl mb-2">🧠</div>
            <div className="text-3xl font-bold text-white">{memories.length}</div>
            <div className="text-xs text-zinc-500">记忆碎片</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-3xl font-bold text-[#ff2d55]">{totalImpact.toFixed(0)}</div>
            <div className="text-xs text-zinc-500">总漂移值</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-3xl font-bold text-white">{soul?.evolutionStage || 'puppy'}</div>
            <div className="text-xs text-zinc-500">当前阶段</div>
          </div>
        </div>

        {/* 搜索 & 过滤 */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="搜索记忆..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-2xl px-6 py-4 focus:border-[#ff2d55] outline-none"
          />
          
          <div className="flex bg-zinc-900 border border-zinc-700 rounded-2xl p-1">
            {(['all', 'interaction', 'evolution'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-5 py-3 rounded-xl text-sm transition-all ${filter === type 
                  ? 'bg-[#ff2d55] text-white' 
                  : 'hover:bg-zinc-800'}`}
              >
                {type === 'all' ? '全部' : type === 'interaction' ? '互动' : '进化'}
              </button>
            ))}
          </div>
        </div>

        {/* 记忆时间线 */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredMemories.length > 0 ? (
              filteredMemories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-zinc-900 border-l-4 border-[#ff2d55] rounded-3xl p-6 hover:border-[#00f5ff] transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {memory.type === 'interaction' ? '💬' : '⚡'}
                      </div>
                      <div>
                        <div className="font-mono text-xs text-zinc-500">
                          {new Date(memory.timestamp).toLocaleString('zh-CN')}
                        </div>
                        <div className="text-sm uppercase tracking-widest text-[#ff2d55]">
                          {memory.type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`px-4 py-1 rounded-full text-xs font-bold ${
                      memory.impact > 10 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      +{memory.impact.toFixed(1)} 漂移
                    </div>
                  </div>

                  <div className="text-[17px] leading-relaxed text-zinc-100 mb-4">
                    “{memory.content}”
                  </div>

                  <div className="flex items-center gap-6 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4" />
                      心情 {memory.mood_delta > 0 ? '+' : ''}{memory.mood_delta}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4" />
                      性格剧变
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 text-zinc-500">
                还没有任何记忆...<br />去和你的疯狗对话吧
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-500 bg-black/80 px-6 py-2 rounded-2xl border border-zinc-800">
        所有记忆永久保存 · 不可逆转
      </div>
    </div>
  );
}
