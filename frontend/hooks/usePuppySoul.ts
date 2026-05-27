// ========================================
// 宠物灵魂状态管理 Hook - WebSocket 集成
// ========================================

import { useState, useEffect, useCallback, useRef } from 'react';

// ✅ 修复：统一使用 snake_case 字段名
export interface PuppySoul {
  id: string;
  name: string;
  evolution_stage: string;  // ✅ 修正：evolutionStage → evolution_stage
  health_score: number;     // ✅ 新增
  total_interactions: number; // ✅ 修正：totalInteractions → total_interactions
  last_interaction: string;
  personality_traits: string[];
  memory_count: number;
  // ✅ 可选：兼容旧代码的 getter（不推荐但可用）
  readonly level?: number;  // 兼容 old code: soul?.level
  readonly evolutionStage?: string;  // 兼容 old code
  readonly totalInteractions?: number;  // 兼容 old code
}

export interface UseSoulWebSocketOptions {
  autoConnect?: boolean;
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UsePuppySoulReturn {
  soul: PuppySoul | null;
  isConnected: boolean;
  sendInteraction: (userInput: string) => void;  // ✅ 修复：只接受 1 个参数
  connect: () => void;
  disconnect: () => void;
  getRecentMemories: () => Promise<any[]>;  // ✅ 新增：供 memory/page.tsx 使用
}

export function usePuppySoul(soulId: string, options: UseSoulWebSocketOptions = {}): UsePuppySoulReturn {
  const { autoConnect = true, onMessage, onError } = options;
  
  const [soul, setSoul] = useState<PuppySoul | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout>();

  // ✅ 修复：sendInteraction 只接受 1 个参数
  const sendInteraction = useCallback((userInput: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'interaction',
        soul_id: soulId,
        user_input: userInput,
        timestamp: new Date().toISOString()
      }));
    }
  }, [soulId]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const ws = new WebSocket(`wss://api.puppyforge.ai/soul/${soulId}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log(`✅ Soul WebSocket connected: ${soulId}`);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'soul_update' && data.payload) {
          // ✅ 修复：确保返回的字段名与接口一致
          setSoul(prev => ({
            ...prev,
            ...data.payload,
            // ✅ 兼容 getter
            level: data.payload.evolution_stage === 'puppy' ? 1 : 
                   data.payload.evolution_stage === 'adult' ? 5 : 10,
            evolutionStage: data.payload.evolution_stage,
            totalInteractions: data.payload.total_interactions
          }));
        }
        onMessage?.(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
        onError?.(error as Error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      onError?.(new Error('WebSocket connection failed'));
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      // 自动重连（指数退避）
      reconnectTimer.current = setTimeout(connect, Math.min(1000 * 2 ** (reconnectTimer.current ? 1 : 0), 30000));
    };
    
    wsRef.current = ws;
  }, [soulId, onMessage, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  // ✅ 新增：获取最近记忆（供 memory/page.tsx 使用）
  const getRecentMemories = useCallback(async () => {
    try {
      const response = await fetch(`/api/soul/${soulId}/memories?limit=20`);
      if (!response.ok) throw new Error('Failed to fetch memories');
      return await response.json();
    } catch (error) {
      console.error('Failed to get recent memories:', error);
      return [];
    }
  }, [soulId]);

  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return {
    soul,
    isConnected,
    sendInteraction,  // ✅ 只接受 1 个参数
    connect,
    disconnect,
    getRecentMemories  // ✅ 新增导出
  };
}

// ✅ 兼容导出：useSoulWebSocket（旧名）
export const useSoulWebSocket = usePuppySoul;
