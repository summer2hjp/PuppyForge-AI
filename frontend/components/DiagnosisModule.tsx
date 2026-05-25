// components/DiagnosisModule.tsx
// ========================================
// AI 实时诊断模块 - 多模态健康诊断引擎
// ========================================

'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';  // ✅ 新增：Next.js 图片优化组件
import { Upload, AlertTriangle, CheckCircle } from 'lucide-react';
// ✅ 修复：合并同一模块的导入（解决 no-duplicate-imports）
import { analyzePetPhoto, type VisionAnalysisResult } from '../lib/vision-analyzer';

interface DiagnosisState {
  image: File | null;
  preview: string | null;
  analysis: VisionAnalysisResult | null;
  loading: boolean;
  error: string | null;
}

export default function DiagnosisModule() {
  const [state, setState] = useState<DiagnosisState>({
    image: null,
    preview: null,
    analysis: null,
    loading: false,
    error: null
  });

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      
      setState(prev => ({
        ...prev,
        image: file,
        preview,
        analysis: null,
        error: null
      }));
    }
  }, []);

  const analyzeImage = async () => {
    if (!state.image) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await analyzePetPhoto(state.image);
      setState(prev => ({ ...prev, analysis: result, loading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : '分析失败',
        loading: false 
      }));
    }
  };

  const reset = () => {
    if (state.preview) {
      URL.revokeObjectURL(state.preview);  // ✅ 清理内存：避免 Blob URL 泄漏
    }
    setState({
      image: null,
      preview: null,
      analysis: null,
      loading: false,
      error: null
    });
  };

  return (
    <div className="p-8 bg-zinc-950 border border-red-500/30 rounded-3xl">
      <h2 className="text-3xl font-bold text-red-400 mb-6">
        🚨 AI 实时诊断引擎
      </h2>

      {!state.preview ? (
        <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-12 text-center">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="hidden" 
            id="upload" 
          />
          <label 
            htmlFor="upload" 
            className="cursor-pointer text-zinc-400 hover:text-white block"
          >
            <Upload className="w-12 h-12 mx-auto mb-4" />
            📸 点击上传粪便 / 皮肤 / 姿态照片
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ✅ 图片预览：使用 Next.js Image 组件优化性能 */}
          <div className="relative rounded-2xl overflow-hidden border border-zinc-700 h-64">
            <Image 
              src={state.preview} 
              alt="Uploaded pet" 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <button
              onClick={reset}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black px-3 py-1 rounded-lg text-sm z-10 transition"
            >
              重新上传
            </button>
          </div>

          {/* 分析按钮 */}
          <button
            onClick={analyzeImage}
            disabled={state.loading}
            className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-bold text-lg disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {state.loading ? (
              <>
                <span className="animate-pulse">🔍</span>
                Grok 多模态引擎狂飙中...
              </>
            ) : (
              <>
                🔥 启动 AI 诊断
              </>
            )}
          </button>

          {/* 错误提示 */}
          {state.error && (
            <div className="p-4 bg-red-900/30 border border-red-500 rounded-xl text-red-300">
              <AlertTriangle className="inline w-5 h-5 mr-2" />
              {state.error}
            </div>
          )}

          {/* 分析结果 */}
          {state.analysis && (
            <div className="p-6 bg-black border border-emerald-500/50 rounded-2xl space-y-4">
              <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                诊断完成
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900 rounded-xl">
                  <div className="text-zinc-400 text-sm">品种</div>
                  <div className="text-white font-bold">{state.analysis.breed}</div>
                </div>
                <div className="p-4 bg-zinc-900 rounded-xl">
                  <div className="text-zinc-400 text-sm">情绪状态</div>
                  <div className="text-white font-bold">{state.analysis.emotionalState}</div>
                </div>
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl">
                <div className="text-zinc-400 text-sm mb-2">建议</div>
                <div className="text-white">{state.analysis.recommendation}</div>
              </div>

              {state.analysis.summary && (
                <div className="p-4 bg-zinc-900 rounded-xl">
                  <div className="text-zinc-400 text-sm mb-2">详细分析</div>
                  <div className="text-zinc-300 text-sm whitespace-pre-line">
                    {state.analysis.summary}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
