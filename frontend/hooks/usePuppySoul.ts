'use client';

import { useEffect, useState, useCallback } from 'react';
import { puppyDB, PuppySoul, PetMemory } from '@/lib/petDB';
import { puppyAPI } from '@/lib/api';

export function usePuppySoul(soulId: string = 'default_mad_dog') {
  const [soul, setSoul] = useState<PuppySoul | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 初始化灵魂
  useEffect(() => {
    const initSoul = async () => {
      try {
        setLoading(true);
        await puppyDB.init();

        let currentSoul = await puppyDB.loadSoul(soulId);

        if (!currentSoul) {
          // 创建初始疯狗灵魂
          currentSoul = {
            id: soulId,
            name: "狂暴小狗",
            level: 1,
            experience: 0,
            traits: {
              loyalty: 65,
              chaos: 85,
              curiosity: 92,
              aggression: 48,
              affection: 78,
            },
            memories: [],
            lastActive: Date.now(),
            totalInteractions: 0,
            evolutionStage: 'puppy' as const,
          };
          await puppyDB.saveSoul(currentSoul);
        }

        setSoul(currentSoul);
      } catch (err) {
        setError('灵魂初始化失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initSoul();
  }, [soulId]);

  // 添加交互（核心方法）
  const addInteraction = useCallback(async (content: string, actionType: string = 'chat') => {
    if (!soul) return null;

    const impact = Math.floor(Math.random() * 15) + 5;
    const mood = Math.floor(Math.random() * 40) - 20;

    // 1. 本地立即记录（实时反馈）
    await puppyDB.addMemory(soul.id, {
      type: 'interaction',
      content,
      impact,
      mood,
      timestamp: Date.now(),
    });

    // 刷新本地状态
    const updatedSoul = await puppyDB.loadSoul(soul.id);
    if (updatedSoul) setSoul(updatedSoul);

    // 2. 尝试云端同步（联网时）
    if (isOnline) {
      try {
        const cloudResult = await puppyAPI.interact(soul.id, actionType, content);
        
        // 用云端结果覆盖本地进化
        if (cloudResult?.soul) {
          await puppyDB.saveSoul(cloudResult.soul);
          setSoul(cloudResult.soul);
          return cloudResult;
        }
      } catch (err) {
        console.log('🌩️ 云端失联，使用本地叛变进化');
      }
    }

    return { success: true, localOnly: !isOnline };
  }, [soul, isOnline]);

  // 强制进化
  const evolve = useCallback(async () => {
    if (!soul) return;

    try {
      let result;
      if (isOnline) {
        result = await puppyAPI.evolve(soul.id);
      }

      // 本地进化逻辑
      const newSoul = { ...soul };
      newSoul.level = Math.min(30, newSoul.level + 1);
      newSoul.experience += 100;

      Object.keys(newSoul.traits).forEach(key => {
        newSoul.traits[key] = Math.min(100, Math.max(0, newSoul.traits[key] + 8));
      });

      await puppyDB.saveSoul(newSoul);
      setSoul(newSoul);

      return result || { success: true };
    } catch (err) {
      console.error('进化失败', err);
    }
  }, [soul, isOnline]);

  // 获取最新记忆
  const getRecentMemories = useCallback(async (limit = 10): Promise<PetMemory[]> => {
    if (!soul) return [];
    return puppyDB.getAllMemories(soul.id).then(memories => memories.slice(0, limit));
  }, [soul]);

  return {
    soul,
    loading,
    error,
    isOnline,
    addInteraction,
    evolve,
    getRecentMemories,
    refresh: () => window.location.reload(), // 强制刷新灵魂
  };
}
