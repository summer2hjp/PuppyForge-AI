'use client';

import { useState, useRef } from 'react';
import { Loader2, AlertCircle, Camera, Sparkles, Activity, Shield } from 'lucide-react';
import { analyzePetPhoto, type VisionAnalysis } from '@/lib/vision-analyzer';
import { generateDiagnosisReport, type DiagnosisReport } from '@/lib/diagnosis';

interface DiagnosisModulePanelProps {
  onAnalysisComplete?: (result: VisionAnalysis) => void;
}

export default function DiagnosisModulePanel({ onAnalysisComplete }: DiagnosisModulePanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selected.type)) {
      setError('仅支持 JPG、PNG、WEBP 格式的图片');
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setError('图片大小不能超过 20MB');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setAnalysis(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzePetPhoto(file);
      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '诊断分析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setAnalysis(null);
    setError(null);
  };

  const getHealthColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getHealthLabel = (score: number): string => {
    if (score >= 80) return '健康';
    if (score >= 60) return '一般';
    return '需关注';
  };

  const getHealthBarColor = (score: number): string => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300
          ${preview ? 'border-cyan-500/30 bg-zinc-900/30' : 'border-zinc-700 hover:border-cyan-500/50 bg-zinc-900/50'}
          ${loading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          data-testid="vision-file-input"
        />

        {preview ? (
          <div className="p-4">
            <div className="relative rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="宠物照片预览"
                className="w-full max-h-80 object-contain bg-zinc-900"
              />
              <button
                type="button"
                onClick={handleReset}
                className="absolute top-2 right-2 p-1.5 bg-zinc-900/80 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-16 flex flex-col items-center justify-center gap-3 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Camera className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium">点击上传宠物照片</p>
              <p className="text-zinc-600 text-xs mt-1">支持 JPG、PNG、WEBP，最大 20MB</p>
            </div>
            <span className="text-xs text-cyan-500/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI 视觉诊断
            </span>
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-medium">诊断失败</p>
            <p className="text-red-400/80 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {preview && !analysis && !loading && (
        <button
          type="button"
          data-testid="vision-analyze-btn"
          onClick={handleAnalyze}
          disabled={loading || !file}
          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl text-white font-medium transition flex items-center justify-center gap-2"
        >
          <Activity className="w-4 h-4" />
          开始 AI 健康诊断
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-3">
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <div className="absolute inset-0 animate-pulse rounded-full bg-cyan-500/20 blur-xl" />
          </div>
          <span className="text-sm">AI 正在分析宠物健康状态...</span>
          <p className="text-xs text-zinc-600">多模态视觉分析进行中</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Health Score */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">健康评分</h3>
              </div>
              <div className="text-right">
                <span className={`text-3xl font-bold ${getHealthColor(analysis.healthScore ?? 0)}`}>
                  {analysis.healthScore ?? '--'}
                </span>
                <span className="text-zinc-500 text-sm ml-1">/100</span>
              </div>
            </div>

            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${getHealthBarColor(analysis.healthScore ?? 0)}`}
                style={{ width: `${analysis.healthScore ?? 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                {analysis.breed && `品种: ${analysis.breed}`}
              </span>
              <span className={getHealthColor(analysis.healthScore ?? 0)}>
                {getHealthLabel(analysis.healthScore ?? 0)}
              </span>
            </div>
          </div>

          {/* Breed + Emotion */}
          <div className="grid grid-cols-2 gap-3">
            {analysis.breed && (
              <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
                <div className="text-zinc-500 text-xs mb-1">品种</div>
                <div className="text-white font-bold">{analysis.breed}</div>
              </div>
            )}
            {analysis.emotionalState && (
              <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
                <div className="text-zinc-500 text-xs mb-1">情绪状态</div>
                <div className="text-white font-bold">{analysis.emotionalState}</div>
              </div>
            )}
          </div>

          {/* Summary */}
          {analysis.summary && (
            <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-xl">
              <h4 className="text-sm font-semibold text-zinc-300 mb-2">分析总结</h4>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                {analysis.summary}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendation && (
            <div className="p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
              <h4 className="text-sm font-semibold text-cyan-300 mb-2">护理建议</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">{analysis.recommendation}</p>
            </div>
          )}

          {/* Re-analyze */}
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white text-sm font-medium transition"
          >
            重新诊断
          </button>
        </div>
      )}
    </div>
  );
}

interface DiagnosisModuleProps {
  petId: string;
  analysisData: unknown;
}

export function DiagnosisModule({ petId, analysisData }: DiagnosisModuleProps) {
  const [report, setReport] = useState<DiagnosisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dataInput =
    analysisData && typeof analysisData === 'object'
      ? (analysisData as { traits?: string[]; healthScore?: number } | null)
      : null;

  if (!report && !error) {
    generateDiagnosisReport(petId, dataInput)
      .then(setReport)
      .catch(() => setError('诊断服务暂时不可用'));
  }

  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!report) return <div className="text-zinc-500 text-sm">诊断加载中...</div>;

  return (
    <div className="p-4 bg-zinc-800/40 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-sm">健康评分</span>
        <span className="text-white font-bold">{report.healthScore}</span>
      </div>
      {report.driftPrediction && (
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 text-sm">漂移预测</span>
          <span className="text-amber-300 text-sm">{report.driftPrediction}</span>
        </div>
      )}
    </div>
  );
}
