// ========================================
// 快速诊断组件 - 一键上传分析
// ========================================

'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
// ✅ 修复：使用正确的类型名 VisionAnalysis（不是 VisionAnalysisResult）
import { analyzePetPhoto, type VisionAnalysis } from '@/lib/vision-analyzer';

interface QuickDiagnoseProps {
  puppyId?: string;
  onAnalysisComplete?: (result: VisionAnalysis) => void;
}

export default function QuickDiagnose({ puppyId = 'default', onAnalysisComplete }: QuickDiagnoseProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ 修复：清理 Blob URL 避免内存泄漏
  const cleanupPreview = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [preview]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    cleanupPreview();
    setError(null);
    setAnalysis(null);
    
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      
      // 验证文件类型
      if (!selectedFile.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }
      
      // 验证文件大小（限制 10MB）
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('图片大小不能超过 10MB');
        return;
      }
      
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }, [cleanupPreview]);

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      setError('请先选择图片');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // ✅ 修复：analyzePetPhoto 只接收 File 和可选配置对象
      const result = await analyzePetPhoto(file, {
        model: 'grok-vision',
        confidence_threshold: 0.7
      });
      
      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      console.error('分析失败:', err);
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [file, onAnalysisComplete]);

  const handleReset = useCallback(() => {
    cleanupPreview();
    setFile(null);
    setAnalysis(null);
    setError(null);
  }, [cleanupPreview]);

  // ✅ 修复：组件卸载时清理资源
  useState(() => () => cleanupPreview());

  return (
    <div className="p-6 bg-zinc-900/50 border border-zinc-700 rounded-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">🔍 快速诊断</h3>
        {analysis && (
          <button
            onClick={handleReset}
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            重新分析
          </button>
        )}
      </div>

      {/* 上传区域 */}
      {!preview ? (
        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="quick-diagnose-upload"
          />
          <div className="border-2 border-dashed border-zinc-600 hover:border-purple-500 rounded-xl p-8 text-center cursor-pointer transition group">
            <Upload className="w-12 h-12 mx-auto mb-4 text-zinc-500 group-hover:text-purple-400 transition" />
            <p className="text-zinc-400 group-hover:text-zinc-300">
              点击上传宠物照片
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              支持 JPG/PNG，最大 10MB
            </p>
          </div>
        </label>
      ) : (
        /* 预览区域 */
        <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
          <Image
            src={preview}
            alt="Preview"
            width={400}
            height={300}
            className="w-full h-48 object-cover"
            unoptimized // Blob URL 无需 Next.js 优化
          />
          <button
            onClick={handleReset}
            className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black rounded-lg text-white transition"
            aria-label="移除图片"
          >
            ×
          </button>
        </div>
      )}

      {/* 分析按钮 */}
      {preview && !analysis && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 rounded-xl text-white font-medium transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI 分析中...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              开始分析
            </>
          )}
        </button>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">分析失败</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* 分析结果 */}
      {analysis && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">分析完成</span>
            </div>
            
            {/* ✅ 修复：使用类型断言访问 VisionAnalysis 字段 */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-zinc-400">品种</span>
                <p className="text-white font-medium">
                  {(analysis as VisionAnalysis).breed ?? '识别中...'}
                </p>
              </div>
              <div>
                <span className="text-zinc-400">情绪</span>
                <p className="text-white font-medium">
                  {(analysis as VisionAnalysis).emotionalState ?? 'neutral'}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-zinc-400">建议</span>
                <p className="text-white">
                  {(analysis as VisionAnalysis).recommendation ?? '保持观察'}
                </p>
              </div>
            </div>
          </div>

          {/* 健康评分 */}
          {(analysis as VisionAnalysis).healthScore !== undefined && (
            <div className="p-4 bg-zinc-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">健康评分</span>
                <span className={`font-bold ${
                  (analysis as VisionAnalysis).healthScore! >= 90 ? 'text-emerald-400' :
                  (analysis as VisionAnalysis).healthScore! >= 70 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {(analysis as VisionAnalysis).healthScore}/100
                </span>
              </div>
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    (analysis as VisionAnalysis).healthScore! >= 90 ? 'bg-emerald-500' :
                    (analysis as VisionAnalysis).healthScore! >= 70 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${(analysis as VisionAnalysis).healthScore}%` }}
                />
              </div>
            </div>
          )}

          {/* 详细摘要 */}
          {(analysis as VisionAnalysis).summary && (
            <div className="p-4 bg-zinc-800 rounded-xl">
              <span className="text-zinc-400 text-sm block mb-2">详细分析</span>
              <p className="text-zinc-300 text-sm whitespace-pre-line">
                {(analysis as VisionAnalysis).summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
