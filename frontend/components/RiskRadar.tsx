// components/RiskRadar.tsx
'use client';

import { AlertTriangle, Shield, Clock } from 'lucide-react';

interface RiskRadarProps {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictions?: string[];
  interventionWindow?: string;
}

export default function RiskRadar({ 
  riskLevel,
  predictions = [],
  interventionWindow = '72 小时'
}: RiskRadarProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-emerald-400 border-emerald-500/30 hover:border-emerald-500';
      case 'MEDIUM':
        return 'text-yellow-400 border-yellow-500/30 hover:border-yellow-500';
      case 'HIGH':
        return 'text-orange-400 border-orange-500/30 hover:border-orange-500';
      case 'CRITICAL':
        return 'text-red-500 border-red-500/30 hover:border-red-500';
      default:
        return 'text-zinc-400 border-zinc-500/30 hover:border-zinc-500';
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'LOW':
        return <Shield className="w-8 h-8" />;
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle className="w-8 h-8" />;
      default:
        return <Clock className="w-8 h-8" />;
    }
  };

  return (
    <div className={`bg-zinc-900 border rounded-3xl p-8 transition-all ${getRiskColor(riskLevel)}`}>
      <h2 className="text-xl text-cyan-400">RISK RADAR</h2>
      
      <div className="mt-6 flex items-center gap-4">
        {getRiskIcon()}
        <div className={`text-5xl font-bold ${riskLevel === 'CRITICAL' ? 'animate-pulse' : ''}`}>
          {riskLevel}
        </div>
      </div>
      
      <div className="text-sm mt-4 opacity-70">
        <div>干预窗口：{interventionWindow}</div>
        <div>30 天预测轨迹</div>
      </div>

      {predictions.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm text-zinc-400 font-semibold">风险预警</h3>
          {predictions.slice(0, 3).map((pred, i) => (
            <div key={i} className="text-xs text-zinc-300 bg-zinc-800/50 px-3 py-2 rounded-lg">
              • {pred}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
