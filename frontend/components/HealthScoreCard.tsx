'use client';

import React, { useEffect, useState } from 'react';
import { SwarmResult } from '../ai-agents/types';

interface HealthScoreCardProps {
  puppyId: string;
}

export default function HealthScoreCard({ puppyId }: HealthScoreCardProps) {
  const [score, setScore] = useState(85);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [persona, setPersona] = useState({ energy: 0.7, trust: 0.8 });

  useEffect(() => {
    const handleUpdate = (e: CustomEvent) => {
      const result: SwarmResult = e.detail;
      setScore(result.health_score);

      const newTrend = result.health_score > score ? 'up' : 'down';
      setTrend(newTrend);

      if (result.persona_impact) {
        setPersona(prev => ({ ...prev, ...result.persona_impact }));
      }
    };

    window.addEventListener('puppy-forge-update', handleUpdate as EventListener);
    return () => window.removeEventListener('puppy-forge-update', handleUpdate as EventListener);
  }, [score]);

  const getColor = (s: number) => {
    if (s >= 90) return 'text-emerald-500';
    if (s >= 75) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">健康指数</h3>
          <div className={`text-6xl font-bold ${getColor(score)} transition-all duration-700`}>
            {score}
            <span className="text-2xl">/100</span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {trend === 'up' ? '↑ 上升' : trend === 'down' ? '↓ 下降' : '→ 稳定'}
        </div>
      </div>

      {/* Trait Drift 可视化 */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {Object.entries(persona).map(([trait, value]) => (
          <div key={trait} className="space-y-2">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>{trait}</span>
              <span>{(value * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000"
                style={{ width: `${value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500 mt-6">
        神经形态引擎实时演化 • Forge 资产已生成
      </p>
    </div>
  );
}
