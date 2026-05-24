'use client';

import React, { useState } from 'react';
import HealthScoreCard from '../components/HealthScoreCard';
import PuppyProfile from '../components/PuppyProfile';
import RiskRadar from '../components/RiskRadar';
import RebelPanel from '../components/RebelPanel';
import { visionAnalyzer } from '../lib/vision-analyzer';
import { swarmOrchestrator } from '../ai-agents/swarm-orchestrator';

export default function PuppyForgeDashboard() {
  const [puppyId] = useState("p001");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastDiagnosis, setLastDiagnosis] = useState<any>(null);
  const [rebelSuggestions, setRebelSuggestions] = useState<any[]>([]);

  const handleImageUpload = async () => {
    if (!imageFile || !description) {
      alert("请上传图片并填写描述");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await visionAnalyzer.analyze(imageFile, description, puppyId);
      setLastDiagnosis(result.diagnosis);
      
      console.log("🔥 Vision + Neuromorphic 全链路完成");
    } catch (error) {
      console.error("诊断失败:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRebelTrigger = (suggestion: any) => {
    setRebelSuggestions(prev => [suggestion, ...prev].slice(0, 3));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* 顶部导航 */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🐾</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter">PuppyForge-AI</h1>
              <p className="text-xs text-zinc-500">M3 • 叛逆灵魂已觉醒</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-emerald-400 font-mono">神经引擎在线</span>
            <span className="text-red-400 font-mono">Rebel Mode 已激活</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-5xl font-bold tracking-tighter">小黄的数字生命体</h2>
            <p className="text-xl text-zinc-400 mt-3">诊断 → 预测 → 干预 → 记忆演化 → <span className="text-red-400">Rebel 叛逆</span></p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* 左侧栏：档案 + 视觉诊断 + Rebel */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            <PuppyProfile puppyId={puppyId} initialName="小黄" />

            {/* 视觉诊断入口 */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                🧬 视觉灵魂诊断
              </h3>
              
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="block w-full mb-4 text-sm text-zinc-400 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:bg-violet-600 file:text-white"
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述宠物当前状态（支持视觉 + 文本）..."
                className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded-2xl p-5 text-sm resize-y focus:border-violet-500 outline-none"
              />

              <button
                onClick={handleImageUpload}
                disabled={isAnalyzing || !imageFile || !description}
                className="mt-6 w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-semibold hover:brightness-110 transition disabled:opacity-50"
              >
                {isAnalyzing ? "神经诊断 + Forge 进行中..." : "启动视觉诊断"}
              </button>
            </div>

            {/* M3 Rebel Agent 面板 */}
            <RebelPanel onRebelTrigger={handleRebelTrigger} />
          </div>

          {/* 右侧栏：核心指标 + 叛逆建议历史 */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            <HealthScoreCard puppyId={puppyId} />
            <RiskRadar puppyId={puppyId} />

            {/* 最新诊断 */}
            {lastDiagnosis && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
                <h3 className="text-xl font-semibold mb-4">最新诊断结论</h3>
                <div className="bg-zinc-950 rounded-2xl p-6 space-y-4 text-sm">
                  <div><span className="text-zinc-400">状态：</span>{lastDiagnosis.condition}</div>
                  <div><span className="text-zinc-400">风险等级：</span><span className="text-rose-400">{lastDiagnosis.risk_level}/10</span></div>
                  <ul className="list-disc list-inside space-y-1 text-emerald-300">
                    {lastDiagnosis.suggestions?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* Rebel 建议历史 */}
            {rebelSuggestions.length > 0 && (
              <div className="bg-gradient-to-br from-red-950 to-zinc-950 border border-red-500/30 rounded-3xl p-8">
                <h3 className="text-xl font-semibold text-red-400 mb-6 flex items-center gap-2">
                  🔥 Rebel Agent 叛逆建议
                </h3>
                <div className="space-y-6">
                  {rebelSuggestions.map((suggestion, index) => (
                    <div key={index} className="border-l-4 border-red-500 pl-6">
                      <p className="text-lg leading-relaxed">{suggestion.suggestion}</p>
                      <div className="mt-3 text-xs text-red-400/70">
                        叛逆指数 {Math.round(suggestion.rebel_factor * 100)}% • 风险 {suggestion.risk_level}/10
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800 py-10 mt-20 text-center text-xs text-zinc-500">
        PuppyForge-AI M3 • 神经形态引擎 + Forge Pipeline + Rebel Agent + WASM 边缘沙箱 • 
        让宠物灵魂真正自由进化
      </footer>
    </div>
  );
}
