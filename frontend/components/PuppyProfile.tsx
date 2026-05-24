'use client';

import React, { useState, useEffect } from 'react';
import { SwarmResult } from '../ai-agents/swarm-orchestrator';

interface PuppyProfileProps {
  puppyId: string;
  initialName?: string;
}

export default function PuppyProfile({ puppyId, initialName = "小黄" }: PuppyProfileProps) {
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState(2.5);
  const [breed, setBreed] = useState("金毛寻回犬");
  const [persona, setPersona] = useState({
    trust: 0.78,
    neuroticism: 0.45,
    energy: 0.82,
    attachment: 0.91
  });
  const [memoriesCount, setMemoriesCount] = useState(42);

  useEffect(() => {
    const handleUpdate = (e: CustomEvent<SwarmResult>) => {
      const result = e.detail;
      if (result.persona_impact) {
        setPersona(prev => ({ ...prev, ...result.persona_impact }));
      }
      setMemoriesCount(prev => prev + 1);
    };

    window.addEventListener('puppy-forge-update', handleUpdate as EventListener);
    return () => window.removeEventListener('puppy-forge-update', handleUpdate as EventListener);
  }, []);

  return (
    <div className="bg-zinc-950 border border-zinc-700 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-5xl shadow-inner">
          🐕
        </div>
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-3xl font-bold bg-transparent border-b border-zinc-700 focus:outline-none focus:border-violet-500 text-white"
          />
          <p className="text-zinc-400 mt-1">{breed} · {age}岁</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-sm text-zinc-500 mb-2">记忆深度</div>
          <div className="text-4xl font-mono font-bold text-violet-400">{memoriesCount}</div>
          <div className="text-xs text-zinc-500">条长期记忆</div>
        </div>
        <div>
          <div className="text-sm text-zinc-500 mb-2">演化阶段</div>
          <div className="inline-flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm">
            神经可塑期
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-800">
        <h4 className="text-sm uppercase tracking-widest text-zinc-500 mb-4">当前人格画像</h4>
        <div className="space-y-3 text-sm">
          {Object.entries(persona).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize text-zinc-400">{key}</span>
              <span className="font-mono text-white">{(value * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => alert('宠物档案已同步至 Qdrant 长期记忆')}
        className="mt-8 w-full py-3 bg-white text-black rounded-2xl font-medium hover:bg-zinc-200 transition"
      >
        更新档案 & 强化记忆
      </button>
    </div>
  );
}
