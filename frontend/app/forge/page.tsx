'use client';

import { Hammer, Zap, BrainCircuit } from 'lucide-react';
import { usePuppySoul } from '@/hooks/usePuppySoul';
import ForgePanel from '@/components/ForgePanel';

export default function ForgePage() {
  const { soul, loading: soulLoading } = usePuppySoul();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950 to-zinc-950">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-8 pt-12 pb-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-purple-400/60 text-xs tracking-widest uppercase mb-2">
              <Hammer className="w-4 h-4" />
              <span>炼金工坊</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
              Forge 炼金工坊
            </h1>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              四阶段炼金锻造管线 · 从提示到永恒记忆
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 pb-16 space-y-8">
        {soulLoading && (
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-pulse">
            <div className="h-6 w-32 bg-zinc-800 rounded mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-zinc-800/50 rounded-xl" />
              <div className="h-20 bg-zinc-800/50 rounded-xl" />
            </div>
          </div>
        )}

        {soul && !soulLoading && (
          <div className="p-6 bg-zinc-900/40 backdrop-blur-sm border border-purple-500/20 rounded-2xl hover:border-purple-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{soul.name}</h3>
                <p className="text-zinc-500 text-xs mt-0.5">锻造管线就绪</p>
              </div>
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-xs font-medium">
                Lv.{soul.level || 1}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <BrainCircuit className="w-3 h-3" />
                  阶段
                </div>
                <div className="text-white font-bold text-sm capitalize">{soul.evolution_stage || 'puppy'}</div>
              </div>
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <Zap className="w-3 h-3" />
                  健康评分
                </div>
                <div className="text-white font-bold text-sm">{soul.health_score ?? 85}/100</div>
              </div>
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <Hammer className="w-3 h-3" />
                  共振次数
                </div>
                <div className="text-white font-bold text-sm">{soul.total_interactions || 0}</div>
              </div>
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <span className="text-xs">🔥</span>
                  灵魂燃料
                </div>
                <div className="text-white font-bold text-sm">{soul.soul_fuel ?? 0}</div>
              </div>
            </div>
          </div>
        )}

        <ForgePanel />
      </div>
    </div>
  );
}
