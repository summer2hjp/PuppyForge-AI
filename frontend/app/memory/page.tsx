'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, Zap, BrainCircuit, RefreshCw } from 'lucide-react';
import { usePuppySoul } from '@/hooks/usePuppySoul';
import { fetchWithAuth } from '@/lib/api-client';
import { MemoryTimeline, type MemoryRecord } from '@/components/memory';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const MEMORY_API = `${API_BASE}/api/v1/interact/interactions`;

export default function MemoryPage() {
  const { soul, loading: soulLoading } = usePuppySoul();

  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${MEMORY_API}/`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      } else if (res.status === 401) {
        setMemories([]);
      } else {
        setError(`请求失败 (${res.status})`);
      }
    } catch {
      setError('无法连接服务器');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-8 pt-12 pb-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-cyan-400/60 text-xs tracking-widest uppercase mb-2">
              <BrainCircuit className="w-4 h-4" />
              <span>灵魂记忆库</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
              记忆编织
            </h1>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              每一次互动都在编织灵魂的成长轨迹
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 pb-16 space-y-8">
        {/* Soul Overview */}
        {soulLoading && (
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-pulse">
            <div className="h-6 w-32 bg-zinc-800 rounded mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-zinc-800/50 rounded-xl" />
              <div className="h-20 bg-zinc-800/50 rounded-xl" />
            </div>
          </div>
        )}

        {soul && !soulLoading && (
          <div className="p-6 bg-zinc-900/40 backdrop-blur-sm border border-cyan-500/20 rounded-2xl hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{soul.name}</h3>
                <p className="text-zinc-500 text-xs mt-0.5">
                  已编织 {memories.length} 条灵魂记忆
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchMemories}
                  disabled={isLoading}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-cyan-400 transition disabled:opacity-50"
                  title="刷新记忆"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-300 text-xs font-medium">
                  Lv.{soul.level || 1}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3" />
                  阶段
                </div>
                <div className="text-white font-bold text-sm capitalize">
                  {soul.evolution_stage || 'puppy'}
                </div>
              </div>
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <Zap className="w-3 h-3" />
                  健康评分
                </div>
                <div className="text-white font-bold text-sm">
                  {soul.health_score ?? 85}/100
                </div>
              </div>
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <BrainCircuit className="w-3 h-3" />
                  共振次数
                </div>
                <div className="text-white font-bold text-sm">
                  {soul.total_interactions || 0}
                </div>
              </div>
              <div className="p-3 bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-500 text-xs flex items-center gap-1.5 mb-1">
                  <span className="text-xs">🔥</span>
                  灵魂燃料
                </div>
                <div className="text-white font-bold text-sm">
                  {soul.soul_fuel ?? 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Memory Timeline */}
        <MemoryTimeline
          memories={memories}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
