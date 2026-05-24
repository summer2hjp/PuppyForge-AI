'use client';

import React, { useState, useEffect } from 'react';
import { SwarmResult } from '../ai-agents/swarm-orchestrator';

interface RiskRadarProps {
  puppyId: string;
}

export default function RiskRadar({ puppyId }: RiskRadarProps) {
  const [riskLevel, setRiskLevel] = useState(3);
  const [risks, setRisks] = useState<Record<string, number>>({
    skin: 35,
    digestive: 20,
    joint: 45,
    emotional: 28
  });

  useEffect(() => {
    const handleUpdate = (e: CustomEvent<SwarmResult>) => {
      const result = e.detail;
      const newRisk = result.diagnosis?.risk_level || 3;
      setRiskLevel(newRisk);

      // 根据诊断动态调整雷达
      if (newRisk > 4) {
        setRisks(prev => ({ ...prev, skin: Math.min(95, prev.skin + 15) }));
      }
    };

    window.addEventListener('puppy-forge-update', handleUpdate as EventListener);
    return () => window.removeEventListener('puppy-forge-update', handleUpdate as EventListener);
  }, []);

  const getRiskColor = (level: number) => {
    if (level <= 3) return 'text-emerald-400';
    if (level <= 6) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="bg-zinc-950 border border-zinc-700 rounded-3xl p-8 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-semibold text-white">风险雷达</h3>
        <div className={`px-5 py-2 rounded-2xl font-mono text-xl font-bold ${getRiskColor(riskLevel)}`}>
          {riskLevel}/10
        </div>
      </div>

      <div className="relative h-64 flex items-center justify-center mb-8">
        {/* 简易雷达可视化 */}
        <div className="relative w-52 h-52 border border-zinc-700 rounded-full">
          {Object.entries(risks).map(([key, value], index) => {
            const angle = (index * 90) + 45;
            const radius = (value / 100) * 90;
            return (
              <div
                key={key}
                className="absolute w-3 h-3 bg-rose-500 rounded-full transition-all duration-700"
                style={{
                  left: `calc(50% + ${radius * Math.cos((angle * Math.PI) / 180)}px)`,
                  top: `calc(50% + ${radius * Math.sin((angle * Math.PI) / 180)}px)`,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(risks).map(([key, value]) => (
          <div key={key} className="flex items-center gap-4">
            <div className="w-28 capitalize text-sm text-zinc-400">{key}</div>
            <div className="flex-1 h-2 bg-zinc-900 rounded">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded transition-all"
                style={{ width: `${value}%` }}
              />
            </div>
            <div className="font-mono w-12 text-right text-sm text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-xs text-zinc-500 border-t border-zinc-800 pt-4">
        Forge 已生成 {riskLevel > 4 ? '紧急' : '常规'} 干预方案 • 建议立即执行
      </div>
    </div>
  );
}
