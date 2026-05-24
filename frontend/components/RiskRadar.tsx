'use client';

import React, { useState, useEffect } from 'react';

interface RiskRadarProps {
  puppyId: string;
}

export default function RiskRadar({ puppyId }: RiskRadarProps) {
  const [riskLevel, setRiskLevel] = useState(3);
  const [risks, setRisks] = useState({
    skin: 42,
    digestive: 25,
    joint: 38,
    emotional: 31
  });

  useEffect(() => {
    const handleUpdate = (e: CustomEvent) => {
      const data = e.detail;
      if (data.diagnosis?.risk_level) {
        const newRisk = data.diagnosis.risk_level;
        setRiskLevel(newRisk);
        
        if (newRisk > 5) {
          setRisks(prev => ({ ...prev, skin: Math.min(98, prev.skin + 18) }));
        }
      }
    };

    window.addEventListener('puppy-forge-update', handleUpdate as EventListener);
    window.addEventListener('persona-realtime-update', handleUpdate as EventListener);

    return () => window.removeEventListener('puppy-forge-update', handleUpdate as EventListener);
  }, []);

  return (
    <div className="bg-zinc-950 border border-zinc-700 rounded-3xl p-8 shadow-2xl">
      <div className="flex justify-between mb-8">
        <h3 className="text-2xl font-semibold">风险雷达</h3>
        <div className={`text-4xl font-bold tabular-nums ${riskLevel > 6 ? 'text-rose-400' : riskLevel > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
          {riskLevel}
          <span className="text-base align-super">/10</span>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(risks).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="capitalize text-zinc-400">{key}风险</span>
              <span className="font-mono">{value}</span>
            </div>
            <div className="h-2.5 bg-zinc-900 rounded-xl overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 transition-all duration-700"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-xs text-zinc-500 border-t border-zinc-800 pt-4">
        Forge 已生成 {riskLevel >= 6 ? '高优先级' : '常规'} 干预方案
      </div>
    </div>
  );
}
