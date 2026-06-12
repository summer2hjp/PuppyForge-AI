// ========================================
// 互动页面 - 实时灵魂共振 + 互动记录
// ========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Zap, Heart, Sparkles, History, Loader2, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import { useSoulWebSocket } from '@/hooks/useSoulWebSocket';
import { fetchWithAuth } from '@/lib/api-client';
import SoulRadar from '@/components/SoulRadar';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const INTERACT_API = `${API_BASE}/api/v1/interact/interactions`;

const QUICK_TYPE_MAP: Record<string, string> = {
  '搞破坏': 'play',
  '表达爱': 'affection',
  '促进化': 'train',
};

const QUICK_EMOJI_MAP: Record<string, string> = {
  play: '⚡',
  affection: '💖',
  train: '✨',
  talk: '💬',
};

export function getInteractionType(content: string): string {
  for (const [keyword, type] of Object.entries(QUICK_TYPE_MAP)) {
    if (content.includes(keyword)) return type;
  }
  return 'talk';
}

interface InteractionRecord {
  id: number;
  content: string;
  interaction_type: string;
  mood_score: number | null;
  location: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
}

export default function InteractPage() {
  const [input, setInput] = useState('');
  const { sendInteraction, isConnected, soul } = useSoulWebSocket({ soulId: 'default_mad_dog' });

  // 互动记录状态
  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // 获取历史互动记录
  const fetchInteractions = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetchWithAuth(`${INTERACT_API}/`);
      if (res.ok) {
        const data = await res.json();
        setInteractions(data);
      } else if (res.status === 401) {
        setInteractions([]);
      } else {
        setHistoryError(`请求失败 (${res.status})`);
      }
    } catch {
      setHistoryError('无法连接服务器');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const createInteraction = useCallback(async (content: string, interactionType: string) => {
    try {
      const res = await fetchWithAuth(`${INTERACT_API}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          interaction_type: interactionType,
        }),
      });
      if (res.ok) {
        const record = await res.json();
        setInteractions(prev => [record, ...prev]);
      } else {
        console.warn('[Interact] POST 互动记录失败:', res.status);
      }
    } catch (err) {
      console.warn('[Interact] POST 互动记录异常:', err);
    }
  }, []);

  // 页面加载时获取历史记录
  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const persistAndSend = (content: string, interactionType: string) => {
    sendInteraction(content);
    createInteraction(content, interactionType);
  };

  const handleSend = () => {
    if (!input.trim() || !isConnected) return;
    const text = input.trim();
    const type = getInteractionType(text);
    persistAndSend(text, type);
    setInput('');
  };

  const handleQuickAction = (message: string) => {
    const type = getInteractionType(message);
    persistAndSend(message, type);
  };

  const getTypeIcon = (type: string) => {
    return QUICK_EMOJI_MAP[type] || '💬';
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950 to-zinc-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 头部 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            🐕‍🦺 灵魂共振实验室
          </h1>
          <p className="text-zinc-400">
            与你的数字宠物进行实时心灵对话
          </p>
        </div>

        {/* 灵魂雷达 */}
        <SoulRadar soulId="default_mad_dog" />

        {/* 灵魂状态 */}
        {soul && (
          <div className="p-6 bg-zinc-900/50 border border-purple-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{soul.name}</h3>
                <p className="text-zinc-400 text-sm">
                  阶段: {soul.evolution_stage || 'puppy'}
                  {' • '}
                  共振: {soul.total_interactions || 0} 次
                </p>
              </div>
              <span className="text-[#ff2d55] font-bold">
                Lv.{soul.level || 1}
              </span>
            </div>

            <div className="flex gap-2">
              {soul.personality_traits?.slice(0, 3).map((trait: string) => (
                <span
                  key={trait}
                  className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 快捷操作 */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleQuickAction("今天一起去搞破坏吧！")}
            className="p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-300 transition flex flex-col items-center gap-2"
          >
            <Zap className="w-6 h-6" />
            <span className="text-sm">搞破坏</span>
          </button>

          <button
            onClick={() => handleQuickAction("我好喜欢你呀")}
            className="p-4 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 rounded-xl text-pink-300 transition flex flex-col items-center gap-2"
          >
            <Heart className="w-6 h-6" />
            <span className="text-sm">表达爱</span>
          </button>

          <button
            onClick={() => handleQuickAction("我们来进化吧！")}
            className="p-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-xl text-cyan-300 transition flex flex-col items-center gap-2"
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-sm">促进化</span>
          </button>
        </div>

        {/* 聊天输入 */}
        <div className="p-6 bg-zinc-900/50 border border-zinc-700 rounded-2xl">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isConnected ? "输入你想对宠物说的话..." : "等待连接..."}
              disabled={!isConnected}
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!isConnected || !input.trim()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 rounded-xl text-white font-medium transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              发送
            </button>
          </div>

          {!isConnected && (
            <p className="mt-3 text-sm text-yellow-400 flex items-center gap-2">
              <span className="animate-pulse">●</span>
              正在连接灵魂网络...
            </p>
          )}
        </div>

        {/* 互动记录时间线 */}
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">互动记录</h2>
          </div>

          {historyLoading && (
            <div className="flex items-center justify-center py-8 text-zinc-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">加载记录中...</span>
            </div>
          )}

          {historyError && (
            <div className="flex items-center justify-center py-8 text-red-400 gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{historyError}</span>
            </div>
          )}

          {!historyLoading && !historyError && interactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-600 gap-2">
              <MessageSquare className="w-8 h-8" />
              <span className="text-sm">暂无互动记录，开始与宠物对话吧！</span>
            </div>
          )}

          {!historyLoading && !historyError && interactions.length > 0 && (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {interactions.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start gap-3 p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/50 hover:border-purple-500/30 transition"
                >
                  <span className="text-lg mt-0.5 shrink-0">{getTypeIcon(record.interaction_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-1.5 py-0.5 bg-zinc-700/60 rounded text-zinc-400 uppercase">
                        {record.interaction_type}
                      </span>
                      {record.mood_score != null && (
                        <span className="text-xs text-yellow-400">
                          {'❤️'.repeat(record.mood_score)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-300 line-clamp-2">{record.content}</p>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-500 text-xs shrink-0 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatTime(record.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
