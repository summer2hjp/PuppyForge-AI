'use client';

import { Zap, Flame, Trophy, ChevronUp } from 'lucide-react';
import type { PuppySoulDetail } from '@/hooks/usePuppySoul';
import { EVOLUTION_META, TRAIT_CONFIG } from '@/hooks/usePuppySoul';

const EVOLUTION_ORDER = ['puppy', 'adult', 'rebel', 'legend'];

interface GrowthArenaProps {
  soul: PuppySoulDetail;
}

export function GrowthArena({ soul }: GrowthArenaProps) {
  const currentStageIndex = EVOLUTION_ORDER.indexOf(soul.evolution_stage);
  const clampedIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  const levelProgress = soul.level % 10;
  const levelProgressPct = Math.min(100, (levelProgress / 10) * 100);
  const nextLevel = soul.level + 1;

  return (
    <div className="space-y-6">
      {/* Evolution Timeline */}
      <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
        <h3 className="text-sm font-semibold text-zinc-400 mb-5 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          进化路线
        </h3>

        <div className="flex items-center justify-between">
          {EVOLUTION_ORDER.map((stage, index) => {
            const meta = EVOLUTION_META[stage];
            const isUnlocked = index <= clampedIndex;
            const isCurrent = index === clampedIndex;

            return (
              <div key={stage} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all duration-300
                      ${isCurrent
                        ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-400/50 shadow-lg shadow-amber-400/20 scale-110'
                        : isUnlocked
                        ? 'bg-zinc-800/60 border border-zinc-700 opacity-80'
                        : 'bg-zinc-900/60 border border-zinc-800 opacity-40'
                      }`}
                  >
                    {meta.emoji}
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      isCurrent
                        ? meta.color
                        : isUnlocked
                        ? 'text-zinc-500'
                        : 'text-zinc-700'
                    }`}
                  >
                    {meta.label}
                  </span>
                </div>
                {index < EVOLUTION_ORDER.length - 1 && (
                  <div
                    className={`w-8 sm:w-12 h-px mx-2 sm:mx-3 mb-5 ${
                      index < clampedIndex
                        ? 'bg-gradient-to-r from-amber-500/50 to-amber-500/20'
                        : 'bg-zinc-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Level & Fuel Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ChevronUp className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-zinc-300">等级</span>
            </div>
            <span className="text-xs text-zinc-500">
              Lv.{soul.level} → Lv.{nextLevel}
            </span>
          </div>
          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
              style={{ width: `${levelProgressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>{levelProgress}/10</span>
            <span>{Math.round(levelProgressPct)}%</span>
          </div>
        </div>

        <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-zinc-300">灵魂燃料</span>
            </div>
            <span className="text-xs text-zinc-500">{soul.soul_fuel ?? 100}/100</span>
          </div>
          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700"
              style={{ width: `${soul.soul_fuel ?? 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>能量</span>
            <span>{Math.round(soul.soul_fuel ?? 100)}%</span>
          </div>
        </div>
      </div>

      {/* Trait Scores */}
      <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          灵魂特质
        </h3>
        <div className="space-y-3">
          {TRAIT_CONFIG.map((trait) => {
            const value = soul.traits?.[trait.key] ?? 50;
            return (
              <div key={trait.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{trait.label}</span>
                  <span className="text-zinc-500">{Math.round(value)}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${trait.color} transition-all duration-700`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
