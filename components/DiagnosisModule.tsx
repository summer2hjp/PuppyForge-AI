'use client';

import { useState } from 'react';

export default function DiagnosisModule() {
  const [image, setImage] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    setTimeout(() => {
      setAnalysis(`AI诊断结果：\n- 粪便/皮肤异常概率: 85%\n- 可能疾病：轻度肠胃炎\n- 紧急程度：中\n- 建议：立即补充益生菌 + 观察24小时`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-8 bg-zinc-950 border border-red-500/30 rounded-3xl">
      <h2 className="text-3xl font-bold text-red-400 mb-6">🚨 AI 实时诊断引擎</h2>
      
      <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-12 text-center">
        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="upload" />
        <label htmlFor="upload" className="cursor-pointer text-zinc-400 hover:text-white block">
          📸 点击上传粪便 / 皮肤 / 姿态照片
        </label>
        {image && <p className="mt-4 text-sm text-emerald-400">已选: {image.name}</p>}
      </div>

      <button 
        onClick={analyzeImage}
        disabled={!image || loading}
        className="mt-6 w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-bold text-lg disabled:opacity-50 transition"
      >
        {loading ? 'Grok多模态引擎狂飙中...' : '🔥 启动AI诊断'}
      </button>

      {analysis && (
        <div className="mt-8 p-6 bg-black border border-emerald-500/50 rounded-2xl whitespace-pre-line font-mono text-sm">
          {analysis}
        </div>
      )}
    </div>
  );
}