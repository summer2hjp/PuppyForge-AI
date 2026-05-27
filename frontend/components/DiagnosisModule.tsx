'use client';

import { useState, useEffect } from 'react';
import { analyzePetPhoto, type VisionAnalysis } from '@/lib/vision-analyzer';
import { generateDiagnosisReport, type DiagnosisReport } from '@/lib/diagnosis';

export default function DiagnosisModulePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzePetPhoto(file);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-zinc-950 border border-red-500/30 rounded-3xl">
      <h2 className="text-3xl font-bold text-red-400 mb-6">🚨 AI 实时诊断引擎</h2>
      <input
        data-testid="image-upload"
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button onClick={onAnalyze} disabled={!file || loading}>开始诊断</button>
      {error && <div>{error}</div>}
      {analysis && <div>诊断完成</div>}
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

  useEffect(() => {
    let mounted = true;
    generateDiagnosisReport(
      petId,
      (analysisData && typeof analysisData === 'object'
        ? analysisData
        : null) as { traits?: string[]; healthScore?: number } | null
    )
      .then((nextReport) => {
        if (mounted) setReport(nextReport);
      })
      .catch(() => {
        if (mounted) setError('诊断服务暂时不可用');
      });

    return () => {
      mounted = false;
    };
  }, [petId, analysisData]);

  if (error) return <div>{error}</div>;
  if (!report) return <div>诊断加载中...</div>;

  return (
    <div>
      <div>{report.healthScore}</div>
      <div>{report.driftPrediction}</div>
    </div>
  );
}
