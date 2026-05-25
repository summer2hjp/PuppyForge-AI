'use client';

import { useState, useCallback, useRef } from 'react';
import { analyzePetPhoto, type VisionAnalysisResult } from '@/lib/vision-analyzer';

interface VisionAnalyzerProps {
  puppyId: string;
  onAnalysisComplete?: (result: VisionAnalysisResult) => void;
}

export default function VisionAnalyzer({ puppyId, onAnalysisComplete }: VisionAnalyzerProps) {
  const [analysis, setAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await runAnalysis(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const runAnalysis = useCallback(async (imageData: string) => {
    setIsLoading(true);
    try {
      const rawResult = await analyzePetPhoto({
        puppy_id: puppyId,
        image_base64: imageData,
        description: 'Vision analysis upload',
        timestamp: new Date().toISOString(),
      });

      // ✅ 严格类型填充，消除 TS2345 报错
      const completeResult: VisionAnalysisResult = {
        ...rawResult,
        timestamp: rawResult.timestamp ?? new Date().toISOString(),
        breed: rawResult.breed ?? 'AI 识别中...',
        emotionalState: rawResult.emotionalState ?? 'calm',
        recommendation: rawResult.recommendation ?? '建议补充详细健康档案与行为记录',
        diagnosis: rawResult.diagnosis ?? {},
        healthScore: typeof rawResult.healthScore === 'number' ? rawResult.healthScore : 0,
      };

      setAnalysis(completeResult);
      onAnalysisComplete?.(completeResult);
    } catch (err) {
      console.error('Vision analysis failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [puppyId, onAnalysisComplete]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <h3 className="text-lg font-semibold text-white">🔍 AI 视觉分析模块</h3>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isLoading}
        className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 disabled:opacity-50"
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="animate-spin">🌀</span> 正在解析宠物特征与行为向量...
        </div>
      )}

      {analysis && (
        <div className="mt-4 space-y-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">品种识别</p>
              <p className="text-white font-medium">{analysis.breed}</p>
            </div>
            <div>
              <p className="text-zinc-500">情绪状态</p>
              <p className="text-white font-medium">{analysis.emotionalState}</p>
            </div>
          </div>
          <div>
            <p className="text-zinc-500 text-sm">健康评分</p>
            <div className="w-full bg-zinc-700 rounded-full h-2.5 mt-1">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, analysis.healthScore))}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 mt-1">{analysis.healthScore}/100</p>
          </div>
          <p className="text-sm text-zinc-300 border-t border-zinc-700 pt-3 mt-3">
            💡 {analysis.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
