'use client';

import { Skull, Zap, BrainCircuit, Flame } from 'lucide-react';
import { usePuppySoul } from '@/hooks/usePuppySoul';
import RebelPanel from '@/components/RebelPanel';

export default function RebelPage() {
  const { soul, loading: soulLoading } = usePuppySoul();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-red-950 to-zinc-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-8 pt-12 pb-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-red-400/60 text-xs tracking-widest uppercase mb-2">
              <Flame className="w-4 h-4" />
              <span>反叛模式</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-300 via-orange-300 to-rose-300 bg-clip-text text-transparent">
              Rebel 模式
            </h1>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              唤醒宠物灵魂中的反叛因子
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 pb-16 space-y-8">
        {/* Soul Overview */}
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
          <div className="p-6 bg-zinc-900/40 backdrop-blur-sm border border-red-500/20 rounded-2xl hover:border-red-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{soul.name}</h3>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {soul.evolution_stage === 'rebel'
                    ? '🔥 已进入叛逆期'
                    : '等待反叛觉醒'}
                </p>
              </div>
              <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-300 text-xs font-medium">
                Lv.{soul.level || 1}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <BrainCircuit className="w-3 h-3" />
                  阶段
                </div>
                <div className="text-white font-bold text-sm capitalize">
                  {soul.evolution_stage || 'puppy'}
                </div>
              </div>
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <Zap className="w-3 h-3" />
                  健康评分
                </div>
                <div className="text-white font-bold text-sm">
                  {soul.health_score ?? 85}/100
                </div>
              </div>
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <Skull className="w-3 h-3" />
                  反叛度
                </div>
                <div className="text-white font-bold text-sm">
                  {soul.traits?.rebellion != null
                    ? `${Math.round(soul.traits.rebellion)}`
                    : '--'}
                </div>
              </div>
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <Flame className="w-3 h-3" />
                  灵魂燃料
                </div>
                <div className="text-white font-bold text-sm">
                  {soul.soul_fuel ?? 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rebel Panel */}
        {soul && !soulLoading && <RebelPanel soul={soul} />}
      </div>
    </div>
  );
}
