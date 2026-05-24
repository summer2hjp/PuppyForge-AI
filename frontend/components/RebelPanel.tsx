'use client';

import React, { useState } from 'react';
import { SwarmResult } from '../ai-agents/swarm-orchestrator';

export default function RebelPanel({ onRebelTrigger }: { onRebelTrigger?: (suggestion: any) => void }) {
  const [rebelIdea, setRebelIdea] = useState<any>(null);
  const [isRebelling, setIsRebelling] = useState(false);

  const triggerRebel = async () => {
    setIsRebelling(true);
    // 模拟调用后端 Rebel Agent
    setTimeout(() => {
      const idea = {
        suggestion: "让它今晚故意不睡觉，观察神经系统极限反应（高创造性实验）",
        risk_level: 8,
        rebel_factor: 0.92,
        reasoning: "常规建议太安全，叛逆才能真正激发成长"
      };
      setRebelIdea(idea);
      onRebelTrigger?.(idea);
      setIsRebelling(false);
    }, 800);
  };

  return (
    <div className="bg-gradient-to-br from-red-950 to-zinc-950 border border-red-500/30 rounded-3xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔥</span>
        <h3 className="text-xl font-bold text-red-400">Rebel Agent</h3>
      </div>
      
      <button
        onClick={triggerRebel}
        disabled={isRebelling}
        className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-2xl font-semibold transition"
      >
        {isRebelling ? "正在叛逆思考..." : "唤醒 Rebel Agent"}
      </button>

      {rebelIdea && (
        <div className="mt-6 p-6 bg-black/50 rounded-2xl border border-red-500/20">
          <div className="text-red-400 text-sm mb-2">REBEL SUGGESTION</div>
          <p className="text-lg leading-snug">{rebelIdea.suggestion}</p>
          <div className="mt-4 text-xs text-zinc-500">
            叛逆指数：{(rebelIdea.rebel_factor * 100).toFixed(0)}% | 风险：{rebelIdea.risk_level}/10
          </div>
        </div>
      )}
    </div>
  );
}
