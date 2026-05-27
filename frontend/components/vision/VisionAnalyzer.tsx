// ========================================
// 视觉分析器组件 - 专业模式
// ========================================

'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Upload, Loader2, Settings, Sparkles, AlertTriangle } from 'lucide-react';
// ✅ 修复：使用正确的类型名 VisionAnalysis
import { analyzePetPhoto, type VisionAnalysis, type VisionAnalyzerOptions } from '@/lib/vision-analyzer';

interface VisionAnalyzerProps {
  puppyId: string;
  onResult?: (result: VisionAnalysis) => void;
  className?: string;
}

export default function VisionAnalyzer({ puppyId, onResult, className = '' }: VisionAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<VisionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<VisionAnalyzerOptions>({
    model: 'grok-vision',
    confidence_threshold: 0.7,
    include_metadata: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ 修复：清理 Blob URL
  const cleanupPreview = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [preview]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    cleanupPreview();
    setError(null);
    setResult(null);
    
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // 验证
    if (!selectedFile.type.startsWith('image/')) {
      setError('仅支持图片文件');
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('图片不能超过 20MB');
      return;
    }
    
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }, [cleanupPreview]);

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      setError('请先上传图片');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // ✅ 修复：正确传递参数（File + 配置对象）
      const analysisResult = await analyzePetPhoto(file, {
        model: options.model,
        confidence_threshold: options.confidence_threshold,
        include_metadata: options.include_metadata
      });
      
      setResult(analysisResult);
      onResult?.(analysisResult);
    } catch (err) {
      console.error('Vision analysis failed:', err);
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setLoading(false);
    }
  }, [file, options, onResult]);

  const handleReset = useCallback(() => {
    cleanupPreview();
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [cleanupPreview]);

  const updateOption = useCallback(<K extends keyof VisionAnalyzerOptions>(
    key: K,
    value: VisionAnalyzerOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // ✅ 修复：组件卸载清理
  useState(() => () => cleanupPreview());

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            专业视觉分析
          </h3>
          <p className="text-sm text-zinc-400">
            多模态 AI 引擎 • 宠物 ID: {puppyId.slice(0, 12)}...
          </p>
        </div>
        {result && (
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
        <label className="block cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="border-2 border-dashed border-zinc-600 hover:border-purple-500 rounded-2xl p-10 text-center transition group bg-zinc-900/30">
            <Upload className="w-14 h-14 mx-auto mb-4 text-zinc-500 group-hover:text-purple-400 transition" />
            <p className="text-zinc-300 font-medium mb-2">
              拖拽或点击上传图片
            </p>
            <p className="text-xs text-zinc-500">
              支持 JPG/PNG/WEBP • 最大 20MB • 建议分辨率 1024x1024+
            </p>
          </div>
        </label>
      ) : (
        /* 预览区域 */
        <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800">
          <Image
            src={preview}
            alt="Analysis preview"
            width={600}
            height={400}
            className="w-full h-64 object-cover"
            unoptimized
          />
          <button
            onClick={handleReset}
            className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black rounded-lg text-white transition"
          >
            ×
          </button>
          
          {/* 分析状态覆盖层 */}
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
                <p className="text-sm">AI 引擎分析中...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 高级选项 */}
      {preview && !result && !loading && (
        <div className="p-4 bg-zinc-800/50 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-zinc-300">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">分析配置</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* 模型选择 */}
            <div>
              <label className="block text-zinc-400 mb-1">AI 模型</
