'use client';

import React, { useState, useEffect } from 'react';
import { BackendSwarmResult } from '../ai-agents/swarm-orchestrator';

interface PuppyProfileProps {
  puppyId: string;
  initialName?: string;
}

export default function PuppyProfile({ puppyId, initialName = "小黄" }: PuppyProfileProps) {
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState(2.8);
  const [breed, setBreed] = useState("金毛寻回犬");
  const [memoriesCount, setMemoriesCount] = useState(87);
  const [persona, setPersona] = useState({
    trust: 0.82,
    neuroticism: 0.41,
    energy: 0.88,
    attachment: 0.93
  });

  useEffect(() => {
    const handleUpdate = (e: CustomEvent) => {
      const data = e.detail;
      if (data.persona) {
        setPersona(data.persona);
      }
      setMemoriesCount(prev => prev + 1);
    };

    window.addEventListener('persona-realtime-update', handleUpdate as EventListener);
    window.addEventListener('puppy-forge-update', handleUpdate as EventListener);

    return () => {
      window.removeEventListener('persona-realtime-update', handleUpdate as EventListener);
      window.removeEventListener('puppy-forge-update', handleUpdate as EventListener);
    };
  }, []);

  return (
    <div className="bg-zinc-950 border border-zinc-700 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-28 h-28 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-3xl flex items-center justify-center text-6xl shadow-xl">
          🐕
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-4xl font-bold bg-transparent border-b border-zinc-700 focus:outline-none focus:border-violet-500 w-full text-white"
          />
          <p className="text-zinc-400 mt-1">{breed} · {age}岁</p>
          <div className="mt-3 inline-flex items-center px-4 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
            数字灵魂活跃
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <div className="text-sm text-zinc-500">记忆深度</div>
          <div className="text-5xl font-mono font-bold text-violet-400 mt-1">{memoriesCount}</div>
          <div className="text-xs text-zinc-500">条 Qdrant 永久记忆</div>
        </div>
        <div>
          <div className="text-sm text-zinc-500">演化阶段</div>
          <div className="text-2xl font-semibold text-amber-400 mt-2">神经可塑期 III</div>
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800">
        <h4 className="uppercase text-xs tracking-widest text-zinc-500 mb-4">当前人格画像</h4>
        <div className="space-y-2 text-sm">
          {Object.entries(persona).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1">
              <span className="capitalize text-zinc-400">{key}</span>
              <span className="font-mono text-white">{(value * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
