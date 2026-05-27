// ========================================
// 视觉分析器组件 - 专业模式
// ========================================

'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Upload, Loader2, Settings, Sparkles, AlertTriangle } from 'lucide-react';
// ✅ 确保导入路径正确
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
              {/* ✅ 修复：标签闭合正确 */}
              <label className="block text-zinc-400 mb-1">AI 模型</label>
              <select
                value={options.model}
                onChange={(e) => updateOption('model', e.target.value as VisionAnalyzerOptions['model'])}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="grok-vision">Grok Vision</option>
                <option value="gpt-4v">GPT-4V</option>
                <option value="claude-3">Claude 3</option>
              </select>
            </div>
            
            {/* 置信度阈值 */}
            <div>
              <label className="block text-zinc-400 mb-1">置信度阈值</label>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={options.confidence_threshold}
                onChange={(e) => updateOption('confidence_threshold', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-zinc-500">
                {(options.confidence_threshold! * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          
          {/* 元数据选项 */}
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={options.include_metadata}
              onChange={(e) => updateOption('include_metadata', e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-700 text-purple-500 focus:ring-purple-500"
            />
            包含详细元数据
          </label>
        </div>
      )}

      {/* 分析按钮 */}
      {preview && !result && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl text-white font-bold transition flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              多模态引擎处理中...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              启动专业分析
            </>
          )}
        </button>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">分析异常</p>
            <p className="text-sm opacity-90">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* 结果概览 */}
          <div className="p-5 bg-gradient-to-br from-emerald-900/40 to-cyan-900/40 border border-emerald-500/50 rounded-2xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-4">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">✨ 分析完成</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* ✅ 修复：使用类型断言访问字段 */}
              <StatItem label="识别品种" value={(result as VisionAnalysis).breed ?? '—'} />
              <StatItem label="情绪状态" value={(result as VisionAnalysis).emotionalState ?? '—'} />
              <StatItem label="健康评分" value={`${(result as VisionAnalysis).healthScore ?? '—'}/100`} />
              <StatItem 
                label="置信度" 
                value={`${((result as VisionAnalysis).diagnosis as any)?.confidence ? (((result as VisionAnalysis).diagnosis as any).confidence * 100).toFixed(1) : '—'}%`} 
              />
            </div>
          </div>

          {/* 建议卡片 */}
          {(result as VisionAnalysis).recommendation && (
            <div className="p-4 bg-zinc-800 rounded-xl border-l-4 border-cyan-500">
              <span className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">专业建议</span>
              <p className="text-white leading-relaxed">
                {(result as VisionAnalysis).recommendation}
              </p>
            </div>
          )}

          {/* 详细摘要 */}
          {(result as VisionAnalysis).summary && (
            <div className="p-4 bg-zinc-800/50 rounded-xl">
              <span className="text-zinc-400 text-xs uppercase tracking-wider block mb-3">详细分析摘要</span>
              <div className="text-zinc-300 text-sm whitespace-pre-line leading-relaxed">
                {(result as VisionAnalysis).summary}
              </div>
            </div>
          )}

          {/* 元数据（如果启用） */}
          {options.include_metadata && (result as VisionAnalysis).diagnosis && (
            <details className="group">
              <summary className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition">
                <span className="text-sm text-zinc-400">🔬 技术元数据</span>
                <span className="text-xs text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-3 bg-zinc-900/50 rounded-b-lg text-xs font-mono text-zinc-500 overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify((result as VisionAnalysis).diagnosis, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ✅ 辅助组件：统计项
function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-zinc-400 block text-xs mb-1">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
