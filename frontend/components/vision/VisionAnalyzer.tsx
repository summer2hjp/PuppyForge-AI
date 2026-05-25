// components/vision/VisionAnalyzer.tsx
'use client';

import { useState, useCallback } from 'react';
import { Camera, Upload } from 'lucide-react';
import { analyzePetPhoto } from '../../lib/vision-analyzer';
import { type VisionAnalysisResult } from '../../ai-agents/types';

interface VisionAnalyzerProps {
  onAnalysisComplete?: (result: VisionAnalysisResult) => void;
}

export default function VisionAnalyzer({ onAnalysisComplete }: VisionAnalyzerProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      setImage(file);
      setPreview(previewUrl);
      setAnalysis(null);
      setError(null);
      setLoading(true);

      try {
        const result = await analyzePetPhoto(file);
        setAnalysis(result);
        onAnalysisComplete?.(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '分析失败');
      } finally {
        setLoading(false);
      }
    }
  }, [onAnalysisComplete]);

  const reset = () => {
    setImage(null);
    setPreview(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="vision-module p-6 bg-zinc-900 border border-zinc-700 rounded-2xl">
      <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5" />
        灵魂视觉诊断
      </h3>

      {!preview ? (
        <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handlePhotoUpload} 
            className="hidden" 
            id="vision-upload" 
          />
          <label 
            htmlFor="vision-upload" 
            className="cursor-pointer text-zinc-400 hover:text-white block"
          >
            <Upload className="w-10 h-10 mx-auto mb-2" />
            点击上传宠物照片
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden">
            <img 
              src={preview} 
              alt="Uploaded pet" 
              className="w-full h-40 object-cover"
            />
            <button
              onClick={reset}
              className="absolute top-2 right-2 bg-black/70 hover:bg-black px-2 py-1 rounded text-xs"
            >
              重新上传
            </button>
          </div>

          {loading && (
            <div className="text-center py-4 text-purple-400 animate-pulse">
              🔍 Grok 多模态引擎分析中...
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {analysis && (
            <div className="p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-xl">
              <div className="font-bold text-emerald-400 mb-2">✓ 诊断完成</div>
              <div className="text-sm space-y-1 text-zinc-300">
                <div><span className="text-zinc-500">品种:</span> {analysis.breed}</div>
                <div><span className="text-zinc-500">情绪:</span> {analysis.emotionalState}</div>
                <div><span className="text-zinc-500">建议:</span> {analysis.recommendation}</div>
              </div>
              {analysis.summary && (
                <div className="mt-3 pt-3 border-t border-emerald-500/30 text-sm text-zinc-400">
                  {analysis.summary}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
