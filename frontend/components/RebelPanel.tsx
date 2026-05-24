'use client';

import React, { useState } from 'react';

interface RebelPanelProps {
  onRebelTrigger?: (suggestion: any) => void;
}

export default function RebelPanel({ onRebelTrigger }: RebelPanelProps) {
  const [rebelIdea, setRebelIdea] = useState<any>(null);
  const [isThinking, setIsThinking] = useState(false);

  const triggerRebel = async () => {
    setIsThinking(true);
    
    // 模拟调用 Rebel Agent
    setTimeout(() => {
      const idea = {
        suggestion: "故意让它尝试从未做过的疯狂游戏，打破常规行为模式，观察神经可塑性极限",
        risk_level: 8,
        rebel_factor: 0.94,
        reasoning: "安全建议只会维持现状，真正的成长来自突破边界"
      };
      setRebelIdea(idea);
      onRebelTrigger?.(idea);
      setIsThinking(false);
    }, 950);
  };

  return (
    <div className="bg-gradient-to-br from-red-950 via-zinc-950 to-zinc-950 border border-red-500/40 rounded-3xl p-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-4xl">🔥</span>
        <div>
          <h3 className="text-2xl font-bold text-red-400">Rebel Agent</h3>
          <p className="text-sm text-red-400/70">反叛智能体 · 挑战常规</p>
        </div>
      </div>

      <button
        onClick={triggerRebel}
        disabled={isThinking}
        className="w-full py-5 bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-2xl font-semibold text-lg transition-all disabled:opacity-70"
      >
        {isThinking ? "正在叛逆思考..." : "唤醒 Rebel 模式"}
      </button>

      {rebelIdea && (
        <div className="mt-8 p-6 bg-black/60 border border-red-500/30 rounded-2xl">
          <div className="uppercase text-xs tracking-widest text-red-400 mb-3">REBEL OUTPUT</div>
          <p className="text-lg leading-relaxed text-white/90">{rebelIdea.suggestion}</p>
          <div className="mt-5 flex gap-6 text-xs text-red-400/70">
            <div>叛逆度: {(rebelIdea.rebel_factor * 100).toFixed(0)}%</div>
            <div>风险等级: {rebelIdea.risk_level}/10</div>
          </div>
        </div>
      )}
    </div>
  );
}
