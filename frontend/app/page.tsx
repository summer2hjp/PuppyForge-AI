'use client';

import React, { useState } from 'react';
import HealthScoreCard from '../components/HealthScoreCard';
import PuppyProfile from '../components/PuppyProfile';
import RiskRadar from '../components/RiskRadar';
import { visionAnalyzer } from '../lib/vision-analyzer';
import { swarmOrchestrator } from '../ai-agents/swarm-orchestrator';

export default function PuppyForgeDashboard() {
  const [puppyId] = useState("p001");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastDiagnosis, setLastDiagnosis] = useState<any>(null);

  const handleImageUpload = async () => {
    if (!imageFile || !description) {
      alert("请上传图片并填写描述");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Vision Analyzer + Swarm Orchestrator 全链路
      const result = await visionAnalyzer.analyze(imageFile, description, puppyId);
      
      setLastDiagnosis(result.diagnosis);
      console.log("🔥 全栈诊断完成:", result);
      
      // Swarm 已自动触发 HealthScoreCard / RiskRadar 等组件更新
    } catch (error) {
      console.error("诊断失败:", error);
      alert("诊断过程中出现错误，请重试");
    } finally {
      setIsAnalyzing(false);
    }
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
              <p className="text-xs text-zinc-500">神经形态数字宠物灵魂锻造平台</p>
            </div>
          </div>
          <div className="text-sm text-emerald-400 font-mono">M2 已上线 • 实时演化中</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-5xl font-bold tracking-tighter">小黄的数字孪生</h2>
            <p className="text-xl text-zinc-400 mt-3">诊断 → 预测 → 干预 → 永久记忆闭环</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-500">当前人格演化状态</div>
            <div className="text-2xl font-mono text-violet-400">活跃</div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* 左侧：宠物档案 + 快速诊断 */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            <PuppyProfile puppyId={puppyId} initialName="小黄" />

            {/* 视觉诊断入口 */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
              <h3 className="text-xl font-semibold mb-6">视觉灵魂诊断</h3>
              
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="block w-full mb-4 text-sm text-zinc-400 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:bg-violet-600 file:text-white"
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述宠物当前状态（如：左后腿轻微跛行，精神较好）"
                className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded-2xl p-5 text-sm resize-y focus:border-violet-500 outline-none"
              />

              <button
                onClick={handleImageUpload}
                disabled={isAnalyzing || !imageFile || !description}
                className="mt-6 w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? "神经诊断中..." : "开始视觉诊断 & 触发 Forge"}
              </button>
            </div>
          </div>

          {/* 右侧：核心指标面板 */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            <HealthScoreCard puppyId={puppyId} />

            <RiskRadar puppyId={puppyId} />

            {/* 最新诊断结果 */}
            {lastDiagnosis && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
                <h3 className="text-xl font-semibold mb-4">最新诊断结果</h3>
                <div className="bg-zinc-950 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">诊断结论</span>
                    <span className="font-medium">{lastDiagnosis.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">风险等级</span>
                    <span className="text-rose-400">{lastDiagnosis.risk_level}/10</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-2">干预建议</span>
                    <ul className="list-disc list-inside space-y-1 text-sm text-emerald-300">
                      {lastDiagnosis.suggestions?.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-8 text-center text-xs text-zinc-500">
          PuppyForge-AI © 2026 • 神经形态引擎 + Forge Pipeline + OTel 可观测性 • 
          每一份记忆都在永恒演化
        </div>
      </footer>
    </div>
  );
}
