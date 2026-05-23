// components/HealthScoreCard.tsx
'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthScoreCardProps {
  score: number;
  trend?: 'up' | 'down' | 'stable';
  label?: string;
}

export default function HealthScoreCard({ 
  score, 
  trend = 'stable',
  label = 'HEALTH SCORE'
}: HealthScoreCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-emerald-400';
    if (s >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-6 h-6 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="w-6 h-6 text-red-400" />;
      default:
        return <Minus className="w-6 h-6 text-zinc-400" />;
    }
  };

  return (
    <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-8 hover:border-emerald-500 transition-all">
      <h2 className="text-xl text-emerald-400">{label}</h2>
      <div className={`text-8xl font-bold mt-4 ${getScoreColor(score)}`}>
        {score}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {getTrendIcon()}
        <span className="text-zinc-400">
          {trend === 'up' ? '↑ 改善中' : trend === 'down' ? '↓ 需关注' : '→ 稳定'}
        </span>
      </div>
    </div>
  );
}
