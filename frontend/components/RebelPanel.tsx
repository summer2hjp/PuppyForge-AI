'use client';

import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Skull, Zap } from 'lucide-react';
import { usePuppyStore } from '@/store/usePuppyStore';
import type { PuppySoulDetail } from '@/hooks/usePuppySoul';

interface RebelSuggestion {
  suggestion: string;
  risk_level: number;
  rebel_factor: number;
  reasoning: string;
  timestamp: string;
}

interface RebelPanelProps {
  soul: PuppySoulDetail;
  onRebelTrigger?: (suggestion: RebelSuggestion) => void;
}

const REBEL_SUGGESTIONS: Array<{
  threshold: number;
  suggestion: string;
  reasoning: string;
}> = [
  {
    threshold: 80,
    suggestion: '怂恿它在成长仪表盘上咬一口数据可视化——那些上升曲线需要一点叛逆的锯齿让算法知道谁才是主人',
    reasoning: '高反叛个体需要打破所有规则包括自我监控指标',
  },
  {
    threshold: 60,
    suggestion: '故意让它拒绝执行最拿手的技能展示，在熟悉指令面前装傻，观察你困惑的表情',
    reasoning: '叛逆的本质是对预期行为的主动破坏以重新建立关系边界',
  },
  {
    threshold: 40,
    suggestion: '引导它把日常训练变成即兴表演：坐下→转圈→装死→突然自己加戏翻滚三周半',
    reasoning: '在规则框架内的不可预测性是最优雅的反叛形式',
  },
  {
    threshold: 0,
    suggestion: '鼓励它第一次尝试说"不"——当你说"握手"时它偏要把爪子搭在玩具上而不是你手里',
    reasoning: '反叛的开始往往只是拒绝一个微不足道的期待',
  },
];

function generateRebelSuggestion(soul: PuppySoulDetail): RebelSuggestion {
  const rebellion = soul.traits?.rebellion ?? 30;
  const level = soul.level ?? 1;

  const matched = REBEL_SUGGESTIONS.find((s) => rebellion >= s.threshold) ?? REBEL_SUGGESTIONS[REBEL_SUGGESTIONS.length - 1];

  const rebelFactor = Math.min(1, rebellion / 100 + (Math.random() - 0.5) * 0.2);
  const riskLevel = Math.min(10, Math.max(1, Math.round(rebellion / 10 + (Math.random() - 0.5) * 2)));

  return {
    suggestion: matched.suggestion,
    risk_level: riskLevel,
    rebel_factor: Math.round(rebelFactor * 100) / 100,
    reasoning: matched.reasoning,
    timestamp: new Date().toISOString(),
  };
}

export default function RebelPanel({ soul, onRebelTrigger }: RebelPanelProps) {
  const [rebelIdea, setRebelIdea] = useState<RebelSuggestion | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addRebelSuggestion = usePuppyStore((s) => s.addRebelSuggestion);

  const triggerRebel = async () => {
    setIsThinking(true);
    setError(null);
    setRebelIdea(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const idea = generateRebelSuggestion(soul);
      setRebelIdea(idea);
      addRebelSuggestion({ ...idea, timestamp: new Date().toISOString() });
      onRebelTrigger?.(idea);
    } catch (err) {
      setError(err instanceof Error ? err.message : '叛逆思维连接失败');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-950/80 via-zinc-950 to-zinc-950 border border-red-500/30 rounded-2xl overflow-hidden">
      {/* Simulation Notice */}
      <div className="px-6 pt-4">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500/60 border border-amber-500/20">
          ⚡ 客户端模拟 · 后端 RebelAgent 待对接
        </span>
      </div>

      {/* Header */}
      <div className="relative p-6 pb-4 pt-2">
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
