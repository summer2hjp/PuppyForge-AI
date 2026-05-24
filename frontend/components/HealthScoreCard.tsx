'use client';

import React, { useEffect, useState } from 'react';
import { SwarmResult } from '../ai-agents/swarm-orchestrator';

interface HealthScoreCardProps {
  puppyId: string;
  className?: string;
}

export default function HealthScoreCard({ puppyId, className = "" }: HealthScoreCardProps) {
  const [score, setScore] = useState<number>(85);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [persona, setPersona] = useState<Record<string, number>>({
    trust: 0.78,
    neuroticism: 0.45,
    energy: 0.82,
    attachment: 0.91
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const handleForgeUpdate = (e: CustomEvent<SwarmResult>) => {
      const result = e.detail;
      
      // 更新健康分
      const newScore = result.health_score;
      setScore(newScore);
      
      // 计算趋势
      setTrend(newScore > score ? 'up' : newScore < score ? 'down' : 'stable');
      
      // 更新人格态
      if (result.persona_impact) {
        setPersona(prev => ({ ...prev, ...result.persona_impact }));
      }
      
      setLastUpdate(new Date());
    };

    window.addEventListener('puppy-forge-update', handleForgeUpdate as EventListener);
    
    return () => {
      window.removeEventListener('puppy-forge-update', handleForgeUpdate as EventListener);
    };
  }, [score]);

  const getScoreColor = (s: number): string => {
    if (s >= 90) return 'text-emerald-400';
    if (s >= 75) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getTraitColor = (value: number) => {
    return `hsl(${value * 120}, 85%, 65%)`;
  };

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">健康指数</h2>
          <p className="text-zinc-500 text-sm mt-1">神经形态实时演化</p>
        </div>
        <div className="text-right">
          <div className={`text-7xl font-bold tabular-nums transition-all duration-700 ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="text-xs text-zinc-500 -mt-2">/100</div>
        </div>
      </div>

      {/* 趋势指示器 */}
      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-8
        ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 
          trend === 'down' ? 'bg-rose-500/10 text-rose-400' : 'bg-zinc-800 text-zinc-400'}`}>
        {trend === 'up' ? '↑ 上升趋势' : trend === 'down' ? '↓ 轻微下降' : '→ 稳定'}
        <span className="text-xs opacity-70">• {lastUpdate.toLocaleTimeString()}</span>
      </div>

      {/* 人格 Trait Drift 可视化 */}
      <div className="space-y-6">
        {Object.entries(persona).map(([trait, value]) => (
          <div key={trait} className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="capitalize text-zinc-400">{trait}</span>
              <span className="font-mono text-white">{(value * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2.5 bg-zinc-900 rounded-xl overflow-hidden">
              <div 
                className="h-full transition-all duration-1000 ease-out rounded-xl"
                style={{ 
                  width: `${value * 100}%`,
                  background: `linear-gradient(90deg, ${getTraitColor(value)}, #c026d3)`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center gap-2">
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
        Forge 资产已生成 • OTel 追踪活跃 • 数字灵魂持续演化
      </div>
    </div>
  );
}
