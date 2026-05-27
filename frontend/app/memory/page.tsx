// ========================================
// 记忆库页面 - 灵魂成长轨迹
// ========================================

'use client';

import { Calendar, Zap, Clock } from 'lucide-react';
import { usePuppySoul } from '@/hooks/usePuppySoul';  // ✅ 使用统一 Hook

export default function MemoryPage() {
  // ✅ 修复：usePuppySoul 返回 getRecentMemories 方法
  const { soul, getRecentMemories } = usePuppySoul('default_mad_dog');
  
  // 模拟记忆数据（实际从 getRecentMemories 获取）
  const memories = [
    {
      id: 'mem_1',
      content: '第一次学会握手！🐾',
      timestamp: '2024-01-15T10:30:00Z',
      emotion: 'excited',
      health_impact: '+5'
    },
    {
      id: 'mem_2',
      content: '发现了藏在沙发下的玩具',
      timestamp: '2024-01-14T15:20:00Z',
      emotion: 'curious',
      health_impact: '+2'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 头部 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            🧠 灵魂记忆库
          </h1>
          <p className="text-zinc-400">
            回顾与宠物共同成长的珍贵瞬间
          </p>
        </div>

        {/* 灵魂概览 */}
        {soul && (
          <div className="p-6 bg-zinc-900/50 border border-cyan-500/30 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{soul.name}</h3>
              {/* ✅ 修复：使用 snake_case 字段 */}
              <span className="text-xs text-zinc-400">
                {/* ✅ 修复：total_interactions 或兼容字段 */}
                {soul.total_interactions || soul.totalInteractions || 0} 次共振
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-800 rounded-xl">
                <div className="text-zinc-400 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  当前阶段
                </div>
                {/* ✅ 修复：evolution_stage 或兼容字段 */}
                <div className="text-white font-bold text-lg">
                  {soul.evolution_stage || soul.evolutionStage || 'puppy'}
                </div>
              </div>
              <div className="p-4 bg-zinc-800 rounded-xl">
                <div className="text-zinc-400 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  健康评分
                </div>
                <div className="text-white font-bold text-lg">
                  {soul.health_score || 85}/100
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 记忆列表 */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            最近记忆
          </h3>
          
          {memories.map((mem) => (
            <div 
              key={mem.id}
              className="p-4 bg-zinc-900/50 border border-zinc-700 rounded-xl hover:border-cyan-500/50 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-white">{mem.content}</p>
                <span className={`px-2 py-1 rounded text-xs ${
                  mem.emotion === 'excited' ? 'bg-pink-500/20 text-pink-300' :
                  mem.emotion === 'curious' ? 'bg-cyan-500/20 text-cyan-300' :
                  'bg-zinc-700 text-zinc-300'
                }`}>
                  {mem.emotion}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{new Date(mem.timestamp).toLocaleString('zh-CN')}</span>
                <span className="text-emerald-400">健康 +{mem.health_impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
