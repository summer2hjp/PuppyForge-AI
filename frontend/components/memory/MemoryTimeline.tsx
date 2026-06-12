'use client';

import { useState, useMemo } from 'react';
import { History, Loader2, AlertCircle, MessageSquare, List, Columns2 } from 'lucide-react';
import { MemoryCard, type MemoryRecord } from './MemoryCard';

interface MemoryTimelineProps {
  memories: MemoryRecord[];
  isLoading: boolean;
  error: string | null;
}

function groupByDate(memories: MemoryRecord[]): Map<string, MemoryRecord[]> {
  const groups = new Map<string, MemoryRecord[]>();
  for (const mem of memories) {
    const date = new Date(mem.created_at).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const existing = groups.get(date) ?? [];
    existing.push(mem);
    groups.set(date, existing);
  }
  return groups;
}

export function MemoryTimeline({ memories, isLoading, error }: MemoryTimelineProps) {
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const groups = useMemo(() => groupByDate(memories), [memories]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm">正在加载记忆...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-red-400 gap-3">
        <AlertCircle className="w-8 h-8" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-600 gap-3">
        <MessageSquare className="w-10 h-10" />
        <span className="text-sm">暂无记忆记录</span>
        <p className="text-xs text-zinc-700">与宠物互动后，记忆将在这里呈现</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">记忆时间线</h3>
          <span className="text-xs text-zinc-500 ml-1">共 {memories.length} 条</span>
        </div>
        <div className="flex bg-zinc-800/60 rounded-lg p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              viewMode === 'timeline'
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5 inline mr-1" />
            时间线
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              viewMode === 'list'
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <List className="w-3.5 h-3.5 inline mr-1" />
            列表
          </button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <TimelineView groups={groups} />
      ) : (
        <ListView groups={groups} />
      )}
    </div>
  );
}

function TimelineView({ groups }: { groups: Map<string, MemoryRecord[]> }) {
  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([date, items]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent" />
            <span className="text-xs text-cyan-400/70 font-medium tracking-wider">{date}</span>
            <div className="h-px flex-1 bg-gradient-to-l from-cyan-500/30 to-transparent" />
          </div>

          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/40 via-blue-500/20 to-transparent" />

            <div className="space-y-4">
              {items.map((memory) => (
                <div key={memory.id} className="relative">
                  <div className="absolute left-0 top-5 w-6 h-6 -translate-x-[3px]">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/30" />
                  </div>
                  <MemoryCard memory={memory} isTimeline />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListView({ groups }: { groups: Map<string, MemoryRecord[]> }) {
  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([date, items]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-cyan-400/70 font-medium">{date}</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>
          <div className="grid gap-3">
            {items.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
