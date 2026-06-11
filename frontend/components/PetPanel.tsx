'use client';

import { Loader2, Zap, Shield } from 'lucide-react';
import { usePuppySoul, TRAIT_CONFIG } from '@/hooks/usePuppySoul';

// ── 组件 ────────────────────────────────────────────────
export default function PetPanel() {
  const { soul, loading, error } = usePuppySoul();

  // ── 加载中 ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-zinc-500 text-xs">
        <Loader2 className="w-3 h-3 animate-spin" />
        加载灵魂数据...
      </div>
    );
  }

  // ── 错误 ──────────────────────────────────────
  if (error) {
    return (
      <div className="py-4 text-center text-xs text-red-400/60">
        {error}
      </div>
    );
  }

  // ── 无数据 ────────────────────────────────────
  if (!soul) return null;

  // ── 渲染 ──────────────────────────────────────
  return (
    <div className="w-full space-y-2 animate-in fade-in duration-500">
      {/* ─── 能量条 ─── */}
      <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Zap className="w-3 h-3 text-yellow-400" />
            灵魂能量
          </span>
          <span className="text-xs font-mono text-zinc-500">{Math.round(soul.soul_fuel)}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(soul.soul_fuel, 100)}%` }}
          />
        </div>
      </div>

      {/* ─── 性格雷达 ─── */}
      <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm">
        <h4 className="text-xs font-semibold text-zinc-300 mb-3 flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-violet-400" />
          性格特质
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {TRAIT_CONFIG.map(({ key, label, color }) => {
            const val = soul.traits[key] ?? 50;
            const pct = Math.min(Math.max(val, 0), 100);
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-14 text-[10px] text-zinc-500 shrink-0 text-right">{label}</span>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-7 text-[10px] font-mono text-zinc-500 text-right">{Math.round(pct)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
