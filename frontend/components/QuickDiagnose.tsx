// components/QuickDiagnose.tsx
'use client';

import { useState, useCallback } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { analyzePetPhoto } from '../lib/vision-analyzer';
import { VisionAnalysisResult } from '../ai-agents/types';

interface QuickDiagnoseProps {
  onDiagnosisComplete?: (result: VisionAnalysisResult) => void;
}

export default function QuickDiagnose({ onDiagnosisComplete }: QuickDiagnoseProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      setImage(file);
      setPreview(previewUrl);
      setAnalysis(null);
      setError(null);
    }
  }, []);

  const analyzeImage = async () => {
    if (!image) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzePetPhoto(image);
      setAnalysis(result);
      onDiagnosisComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-8 hover:border-purple-500 transition-all">
      <h2 className="text-xl text-purple-400 mb-6">QUICK DIAGNOSE</h2>
      
      {!preview ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Camera className="w-16 h-16 mb-4 text-purple-400" />
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="hidden" 
            id="quick-upload" 
          />
          <label 
            htmlFor="quick-upload" 
            className="cursor-pointer bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            上传照片诊断
          </label>
          <p className="text-zinc-500 text-sm mt-4">支持粪便 / 皮肤 / 姿态照片</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-zinc-700">
            <img 
              src={preview} 
              alt="Uploaded pet" 
              className="w-full h-48 object-cover"
            />
            <button
              onClick={reset}
              className="absolute top-2 right-2 bg-black/70 hover:bg-black p-2 rounded-full transition-colors"
              aria-label="删除图片"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!analysis && (
            <button
              onClick={analyzeImage}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-pulse">🔍</span>
                  AI 分析中...
                </>
              ) : (
                <>
                  🔥 启动诊断
                </>
              )}
            </button>
          )}

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500 rounded-xl text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {analysis && (
            <div className="p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                ✓ 诊断完成
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-400">品种:</span>
                  <span className="text-white ml-2">{analysis.breed}</span>
                </div>
                <div>
                  <span className="text-zinc-400">情绪:</span>
                  <span className="text-white ml-2">{analysis.emotionalState}</span>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-zinc-400">建议:</span>
                <p className="text-white mt-1">{analysis.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
