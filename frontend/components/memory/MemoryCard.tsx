import { Clock } from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  play: { icon: '⚡', color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30', label: '玩耍' },
  affection: { icon: '💖', color: 'from-pink-500/20 to-rose-500/10 border-pink-500/30', label: '情感' },
  train: { icon: '✨', color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30', label: '训练' },
  talk: { icon: '💬', color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30', label: '对话' },
  feed: { icon: '🍖', color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30', label: '喂食' },
  walk: { icon: '🚶', color: 'from-teal-500/20 to-cyan-500/10 border-teal-500/30', label: '散步' },
};

const DEFAULT_TYPE = { icon: '📝', color: 'from-zinc-500/20 to-zinc-500/10 border-zinc-500/30', label: '其他' };

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || DEFAULT_TYPE;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return `今天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getMoodHearts(score: number | null): string {
  if (!score) return '';
  const filled = Math.min(score, 5);
  const empty = 5 - filled;
  return '❤️'.repeat(filled) + '🖤'.repeat(empty);
}

export interface MemoryRecord {
  id: number;
  content: string;
  interaction_type: string;
  mood_score: number | null;
  location: string | null;
  created_at: string;
}

interface MemoryCardProps {
  memory: MemoryRecord;
  isTimeline?: boolean;
}

export function MemoryCard({ memory, isTimeline = false }: MemoryCardProps) {
  const cfg = getTypeConfig(memory.interaction_type);

  return (
    <div
      className={`group bg-zinc-900/60 backdrop-blur-sm rounded-xl border transition-all duration-300
        ${cfg.color}
        ${isTimeline ? 'p-4 ml-6' : 'p-4'}
        hover:shadow-lg hover:shadow-current/5 hover:scale-[1.01]`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5 shrink-0">{cfg.icon}</span>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium uppercase tracking-wider">
              {cfg.label}
            </span>
            {memory.mood_score != null && (
              <span className="text-xs leading-none">{getMoodHearts(memory.mood_score)}</span>
            )}
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3 group-hover:text-zinc-200 transition-colors">
            {memory.content}
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-500 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimestamp(memory.created_at)}
            </span>
            {memory.location && <span className="text-zinc-600">📍 {memory.location}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
