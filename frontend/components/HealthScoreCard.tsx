'use client';

import React, { useEffect, useState } from 'react';
import { BackendSwarmResult } from '../ai-agents/swarm-orchestrator';

interface HealthScoreCardProps {
  puppyId: string;
  className?: string;
}

export default function HealthScoreCard({ puppyId, className = "" }: HealthScoreCardProps) {
  const [score, setScore] = useState<number>(87);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [persona, setPersona] = useState<Record<string, number>>({
    trust: 0.82,
    neuroticism: 0.41,
    energy: 0.88,
    attachment: 0.93
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRebelling, setIsRebelling] = useState(false);

  // 统一事件监听：Swarm 更新 + WebSocket 实时人格同步
  useEffect(() => {
    const handleSwarmUpdate = (e: CustomEvent<BackendSwarmResult>) => {
      const result = e.detail;
      handlePersonaUpdate(result.health_score, result.persona_impact || {});
    };

    const handleRealtimePersona = (e: CustomEvent<any>) => {
      const data = e.detail;
      if (data.persona) {
        handlePersonaUpdate(data.health_score, data.persona);
      }
    };

    window.addEventListener('puppy-forge-update', handleSwarmUpdate as EventListener);
    window.addEventListener('persona-realtime-update', handleRealtimePersona as EventListener);

    return () => {
      window.removeEventListener('puppy-forge-update', handleSwarmUpdate as EventListener);
      window.removeEventListener('persona-realtime-update', handleRealtimePersona as EventListener);
    };
  }, []);

  const handlePersonaUpdate = (newScore: number, newPersona: Record<string, number>) => {
    const oldScore = score;
    setScore(Math.round(newScore));

    if (newScore > oldScore + 2) {
      setTrend('up');
    } else if (newScore < oldScore - 2) {
      setTrend('down');
    } else {
      setTrend('stable');
    }

    setPersona(prev => ({ ...prev, ...newPersona }));
    setLastUpdate(new Date());

    // 轻微叛逆视觉反馈
    if (Math.random() > 0.85) {
      setIsRebelling(true);
      setTimeout(() => setIsRebelling(false), 1200);
    }
  };

  const getScoreColor = (s: number): string => {
    if (s >= 92) return 'text-emerald-400';
    if (s >= 78) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getTraitColor = (value: number) => {
    return `hsl(${value * 130}, 88%, 62%)`;
  };

  return (
    <div className={`bg-zinc-950 border border-zinc-700 rounded-3xl p-8 shadow-2xl transition-all duration-700 ${className} ${isRebelling ? 'ring-2 ring-red-500/50' : ''}`}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">健康指数</h2>
            {isRebelling && (
              <span className="px-3 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/30 rounded-full animate-pulse">
                REBEL INFLUENCE
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">神经形态引擎实时演化</p>
        </div>

        <div className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-all
          ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 
            trend === 'down' ? 'bg-rose-500/10 text-rose-400' : 'bg-zinc-800 text-zinc-400'}`}>
          {trend === 'up' ? '↑ 上升' : trend === 'down' ? '↓ 下降' : '→ 稳定'}
        </div>
      </div>

      {/* 大分数展示 */}
      <div className="flex items-baseline mb-10">
        <div className={`text-8xl font-bold tabular-nums transition-all duration-1000 ${getScoreColor(score)}`}>
          {score}
        </div>
        <div className="text-3xl text-zinc-500 ml-2">/100</div>
      </div>

      {/* 人格 Trait Drift 可视化 */}
      <div className="space-y-7">
        {Object.entries(persona).map(([trait, value]) => (
          <div key={trait} className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="capitalize text-zinc-400 font-medium">
                {trait}
              </span>
              <span className="font-mono text-white tracking-wider">
                {(value * 100).toFixed(0)}%
              </span>
            </div>
            
            <div className="h-3 bg-zinc-900 rounded-2xl overflow-hidden relative">
              <div 
                className="h-full rounded-2xl transition-all duration-1000 ease-out shadow-inner"
                style={{ 
                  width: `${Math.max(8, value * 100)}%`,
                  background: `linear-gradient(90deg, ${getTraitColor(value)}, #a855f7)`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 状态信息 */}
      <div className="mt-10 pt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          WebSocket 实时同步
        </div>
        <div>
          最后更新: {lastUpdate.toLocaleTimeString('zh-CN')}
        </div>
      </div>
    </div>
  );
}
