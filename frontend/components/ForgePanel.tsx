'use client';

import { useState } from 'react';
import { Hammer, Loader2, AlertCircle, Sparkles, CheckCircle2, FlaskConical, Gauge, ShieldCheck, Diamond } from 'lucide-react';

const STAGE_ICONS: Record<string, React.ReactNode> = {
  alchemy: <FlaskConical className="w-5 h-5" />,
  forging: <Hammer className="w-5 h-5" />,
  validation: <ShieldCheck className="w-5 h-5" />,
  crystallize: <Diamond className="w-5 h-5" />,
};

interface StageResult {
  stage_name: string;
  label: string;
  description: string;
  status: string;
  quality_score: number;
}

interface ForgeResult {
  soul_id: string;
  base_prompt: string;
  stages: StageResult[];
  final_quality: number;
  status: string;
}

export default function ForgePanel() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<ForgeResult | null>(null);
  const [isForging, setIsForging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStageIdx, setCurrentStageIdx] = useState(-1);
  const [forgeStarted, setForgeStarted] = useState(false);

  const handleForge = async () => {
    if (!prompt.trim()) return;
    setIsForging(true);
    setError(null);
    setResult(null);
    setForgeStarted(true);
    setCurrentStageIdx(0);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const stages: StageResult[] = [
        { stage_name: 'alchemy', label: 'Prompt 炼金', description: '宠物提示词深度进化与重构', status: 'completed', quality_score: 0.88 },
        { stage_name: 'forging', label: '并行锻造', description: '多维度内容并行生成', status: 'completed', quality_score: 0.92 },
        { stage_name: 'validation', label: '对抗质检', description: 'AI 安全与质量对抗审查', status: 'completed', quality_score: 0.86 },
        { stage_name: 'crystallize', label: '资产结晶', description: '向量嵌入固化与永久存储', status: 'completed', quality_score: 0.9 },
      ];

      setResult({
        soul_id: 'default',
        base_prompt: prompt.trim(),
        stages,
        final_quality: stages.reduce((s, st) => s + st.quality_score, 0) / stages.length,
        status: 'completed',
      });
      setCurrentStageIdx(stages.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : '锻造失败');
    } finally {
      setIsForging(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setResult(null);
    setError(null);
    setForgeStarted(false);
    setCurrentStageIdx(-1);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Notice */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500/60 border border-purple-500/20">
          ⚡ 客户端模拟 · 后端 ForgePipeline 待对接
        </span>
      </div>

      {/* Input */}
      {!forgeStarted && (
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-zinc-300">锻造提示词</h3>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想为宠物锻造什么...例如：生成一个勇敢小狗的冒险故事"
            className="w-full px-4 py-3 bg-zinc-800/60 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] resize-y"
            data-testid="forge-prompt-input"
          />
          <button
            type="button"
            onClick={handleForge}
            disabled={!prompt.trim() || isForging}
            data-testid="forge-start-btn"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:from-zinc-800 disabled:to-zinc-800 rounded-xl text-white font-medium transition flex items-center justify-center gap-2"
          >
            {isForging ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                锻造中...
              </>
            ) : (
              <>
                <Hammer className="w-4 h-4" />
                开始锻造
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Forging Progress */}
      {isForging && !error && (
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <div>
              <p className="text-sm font-medium text-zinc-300">四阶段炼金锻造中...</p>
              <p className="text-xs text-zinc-600 mt-0.5">逐阶段执行锻造流水线</p>
            </div>
          </div>
          <ForgeStagesProgress currentIdx={currentStageIdx} />
        </div>
      )}

      {/* Result */}
      {result && !isForging && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Final Quality */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">锻造完成</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-purple-400">
                  {Math.round(result.final_quality * 100)}
                </span>
                <span className="text-zinc-500 text-sm ml-1">分</span>
              </div>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-1000"
                style={{ width: `${result.final_quality * 100}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              提示: {result.base_prompt.length > 60 ? result.base_prompt.slice(0, 60) + '...' : result.base_prompt}
            </p>
          </div>

          {/* Stages */}
          <div className="space-y-3">
            {result.stages.map((stage) => (
              <div
                key={stage.stage_name}
                className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    {STAGE_ICONS[stage.stage_name]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-white">{stage.label}</span>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{stage.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-400 font-mono">
                          {Math.round(stage.quality_score * 100)}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white text-sm font-medium transition"
          >
            重新锻造
          </button>
        </div>
      )}
    </div>
  );
}

function ForgeStagesProgress({ currentIdx }: { currentIdx: number }) {
  const stages = [
    { name: 'alchemy', label: '炼金', icon: <FlaskConical className="w-4 h-4" /> },
    { name: 'forging', label: '锻造', icon: <Hammer className="w-4 h-4" /> },
    { name: 'validation', label: '质检', icon: <ShieldCheck className="w-4 h-4" /> },
    { name: 'crystallize', label: '结晶', icon: <Diamond className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center justify-between">
      {stages.map((stage, idx) => (
        <div key={stage.name} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all duration-300
                ${idx === currentIdx
                  ? 'bg-purple-500/20 border-2 border-purple-400/50 text-purple-300 scale-110 shadow-lg shadow-purple-400/20'
                  : idx < currentIdx
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-800/60 border border-zinc-700 text-zinc-600'
                }`}
            >
              {idx < currentIdx ? <CheckCircle2 className="w-4 h-4" /> : stage.icon}
            </div>
            <span className={`text-[10px] font-medium ${
              idx === currentIdx ? 'text-purple-300' : idx < currentIdx ? 'text-emerald-400' : 'text-zinc-600'
            }`}>
              {stage.label}
            </span>
          </div>
          {idx < stages.length - 1 && (
            <div className={`w-8 sm:w-12 h-px mx-2 mb-4 ${
              idx < currentIdx ? 'bg-emerald-500/40' : idx === currentIdx ? 'bg-purple-500/40' : 'bg-zinc-800'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
