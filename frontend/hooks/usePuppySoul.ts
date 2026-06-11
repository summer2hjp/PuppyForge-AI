'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface PuppySoulDetail {
  id: number;
  name: string;
  breed: string | null;
  level: number;
  soul_fuel: number;
  total_interactions: number;
  evolution_stage: string;
  traits: Record<string, number>;
  avatar_url?: string | null;
  color?: string | null;
  health_score?: number;
}

export const EVOLUTION_META: Record<string, { emoji: string; label: string; color: string }> = {
  puppy: { emoji: '🐶', label: '幼犬期', color: 'text-cyan-400 border-cyan-500/30' },
  adult: { emoji: '🐕', label: '成长期', color: 'text-blue-400 border-blue-500/30' },
  rebel: { emoji: '🐕‍🦺', label: '叛逆期', color: 'text-orange-400 border-orange-500/30' },
  legend: { emoji: '🌌', label: '传说', color: 'text-yellow-400 border-yellow-500/30' },
};

export const TRAIT_CONFIG: { key: string; label: string; color: string }[] = [
  { key: 'affection', label: '亲密度', color: 'from-pink-500 to-rose-400' },
  { key: 'loyalty', label: '忠诚度', color: 'from-blue-500 to-cyan-400' },
  { key: 'curiosity', label: '好奇心', color: 'from-violet-500 to-purple-400' },
  { key: 'intelligence', label: '智慧', color: 'from-emerald-500 to-teal-400' },
  { key: 'chaos', label: '混沌值', color: 'from-orange-500 to-red-400' },
  { key: 'aggression', label: '攻击性', color: 'from-red-500 to-rose-400' },
  { key: 'rebellion', label: '反叛度', color: 'from-yellow-500 to-amber-400' },
];

export function usePuppySoul() {
  const { user, token } = useAuth();
  const [soul, setSoul] = useState<PuppySoulDetail | null>(null);
  const [loading, setLoading] = useState(true);  // 初始为 true，避免闪烁
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      setSoul(null);
      return;
    }

    let cancelled = false;
    const fetchSoul = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/soul/my-soul', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 401 = token 过期或用户已被删除 → 清除会话让用户重新登录
        if (res.status === 401) {
          if (!cancelled) {
            setError('会话已过期，请重新登录');
            useAuth.getState().logout();
          }
          return;
        }

        if (!res.ok) throw new Error('无法加载灵魂数据');
        const data: PuppySoulDetail = await res.json();
        if (!cancelled) setSoul(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSoul();
    return () => { cancelled = true; };
  }, [user, token]);

  const stageMeta = soul
    ? EVOLUTION_META[soul.evolution_stage] || EVOLUTION_META.puppy
    : null;

  return { soul, loading, error, stageMeta };
}
