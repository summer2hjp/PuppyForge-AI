'use client';

import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Skull, Zap } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api-client';
import { usePuppyStore } from '@/store/usePuppyStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RebelSuggestion {
  suggestion: string;
  risk_level: number;
  rebel_factor: number;
  reasoning: string;
  timestamp: string;
}

interface RebelPanelProps {
  onRebelTrigger?: (suggestion: RebelSuggestion) => void;
}

export default function RebelPanel({ onRebelTrigger }: RebelPanelProps) {
  const [rebelIdea, setRebelIdea] = useState<RebelSuggestion | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addRebelSuggestion = usePuppyStore((s) => s.addRebelSuggestion);

  const triggerRebel = async () => {
    setIsThinking(true);
    setError(null);
    setRebelIdea(null);

    try {
      const res = await fetchWithAuth(`${API_BASE}/api/v1/soul/my-soul`);
      if (!res.ok) throw new Error(`请求失败 (${res.status})`);

      const now = new Date().toISOString();
      const idea: RebelSuggestion = {
        suggestion: "故意让它尝试从未做过的疯狂游戏，打破常规行为模式，观察神经可塑性极限",
        risk_level: Math.floor(Math.random() * 5) + 4,
        rebel_factor: 0.7 + Math.random() * 0.25,
        reasoning: "安全建议只会维持现状，真正的成长来自突破边界",
        timestamp: now,
      };

      setRebelIdea(idea);
      addRebelSuggestion(idea);
      onRebelTrigger?.(idea);
    } catch (err) {
      setError(err instanceof Error ? err.message : '叛逆思维连接失败');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-950/80 via-zinc-950 to-zinc-950 border border-red-500/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="relative p-6 pb-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/5 via-transparent to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <Skull className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-400">Rebel Agent</h3>
            <p className="text-xs text-red-400/60">反叛智能体 · 挑战常规</p>
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <div className="px-6 pb-4">
        <button
          onClick={triggerRebel}
          disabled={isThinking}
          data-testid="rebel-trigger-btn"
          className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-zinc-800 disabled:to-zinc-800 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 group"
        >
          {isThinking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              正在叛逆思考...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              唤醒 Rebel 模式
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}

      {/* Result */}
      {rebelIdea && (
        <div className="mx-6 mb-6 p-5 bg-black/60 border border-red-500/20 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="flex items-center gap-2 text-[10px] tracking-widest text-red-400/60 uppercase">
            <Zap className="w-3 h-3" />
            <span>叛逆输出</span>
          </div>

          <p className="text-sm text-zinc-200 leading-relaxed">{rebelIdea.suggestion}</p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-zinc-900/60 rounded-lg">
              <div className="text-[10px] text-zinc-600 mb-1">叛逆度</div>
              <div className="text-sm font-bold text-red-400">
                {(rebelIdea.rebel_factor * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-3 bg-zinc-900/60 rounded-lg">
              <div className="text-[10px] text-zinc-600 mb-1">风险等级</div>
              <div className="text-sm font-bold text-orange-400">
                {rebelIdea.risk_level}/10
              </div>
            </div>
          </div>

          {rebelIdea.reasoning && (
            <div className="pt-1">
              <div className="text-[10px] text-zinc-600 mb-1">推理</div>
              <p className="text-xs text-zinc-500 italic">{rebelIdea.reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Initial hint */}
      {!rebelIdea && !isThinking && !error && (
        <div className="mx-6 mb-6 p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl">
          <p className="text-xs text-zinc-600 text-center">
            👆 点击上方按钮，唤醒宠物的反叛因子
          </p>
        </div>
      )}
    </div>
  );
}
