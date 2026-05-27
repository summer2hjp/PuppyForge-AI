'use client';

import { useState, useCallback } from 'react';
import { analyzePetPhoto, type VisionAnalysis } from '@/lib/vision-analyzer';

interface QuickDiagnoseProps {
  puppyId: string;
  imageUrl?: string;
  imageBase64?: string;
  onDiagnosisComplete?: (result: VisionAnalysisResult) => void;
}

export default function QuickDiagnose({
  puppyId,
  imageUrl,
  imageBase64,
  onDiagnosisComplete,
}: QuickDiagnoseProps) {
  const [analysis, setAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = useCallback(async () => {
    if (!imageUrl && !imageBase64) {
      setError('请提供图片 URL 或 Base64 数据');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. 调用分析器
      const rawResult = await analyzePetPhoto({
        puppy_id: puppyId,
        image_url: imageUrl,
        image_base64: imageBase64,
        description: 'Quick diagnosis scan',
        timestamp: new Date().toISOString(), // ✅ 显式补充 timestamp
      });

      // 2. 类型安全映射：确保完全满足 VisionAnalysisResult 接口
      const completeResult: VisionAnalysisResult = {
        ...rawResult,
        timestamp: rawResult.timestamp ?? new Date().toISOString(),
        breed: rawResult.breed ?? '未知品种',
        emotionalState: rawResult.emotionalState ?? 'neutral',
        recommendation: rawResult.recommendation ?? '保持观察，建议定期健康检查',
        diagnosis: rawResult.diagnosis ?? {},
        healthScore: typeof rawResult.healthScore === 'number' ? rawResult.healthScore : 0,
      };

      setAnalysis(completeResult);
      onDiagnosisComplete?.(completeResult); // ✅ 类型完全匹配
    } catch (err) {
      setError(err instanceof Error ? err.message : '视觉分析失败');
    } finally {
      setLoading(false);
    }
  }, [puppyId, imageUrl, imageBase64, onDiagnosisComplete]);

  return (
    <div className="space-y-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <button
        onClick={handleDiagnose}
        disabled={loading}
        className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors"
      >
        {loading ? '🔍 AI 分析中...' : '⚡ 快速诊断'}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {analysis && (
        <div className="space-y-2 text-sm text-zinc-300">
          <div className="flex justify-between">
            <span>🐾 品种</span>
            <span className="text-white font-medium">{analysis.breed}</span>
          </div>
          <div className="flex justify-between">
            <span>💡 情绪状态</span>
            <span className="text-white font-medium">{analysis.emotionalState}</span>
          </div>
          <div className="flex justify-between">
            <span>❤️ 健康评分</span>
            <span className="text-white font-medium">{analysis.healthScore}/100</span>
          </div>
          <p className="mt-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
            📝 {analysis.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
