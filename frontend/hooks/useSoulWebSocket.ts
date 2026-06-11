// ✅ 修复后完整代码
import { useCallback, useEffect, useRef, useState } from 'react';

// ✅ 严格对齐后端 snake_case 数据契约 + 兼容字段
export interface PuppySoul {
  soul_id: string;
  evolution_stage: string;
  total_interactions: number;
  trait_vector?: number[];
  last_active_at?: string;
  // 兼容旧代码
  name?: string;
  level?: number;
  evolutionStage?: string;
  totalInteractions?: number;
  personality_traits?: string[];
}

export interface SoulInteractionEvent {
  type: 'user_input' | 'soul_response' | 'state_update' | 'barge_in';
  payload?: unknown;
  timestamp: string;
}

interface UseSoulWebSocketOptions {
  soulId: string;
  onStateUpdate?: (soul: PuppySoul) => void;
  onMessage?: (event: SoulInteractionEvent) => void;
}

interface UseSoulWebSocketReturn {
  soul: PuppySoul | null;
  isConnected: boolean;
  sendInteraction: (userInput: string) => void;
  getRecentMemories: (limit?: number) => Promise<SoulInteractionEvent[]>; // ✅ 修复: 添加泛型
  connect: () => void;
  disconnect: () => void;
}

const WS_ENDPOINT = process.env.NEXT_PUBLIC_SOUL_WS_URL || 'ws://localhost:8000/ws/soul';

// ✅ 添加类型守卫函数
function isPuppySoul(payload: unknown): payload is PuppySoul {
  return typeof payload === 'object' && payload !== null && 'soul_id' in payload;
}

export function useSoulWebSocket({
  soulId,
  onStateUpdate,
  onMessage,
}: UseSoulWebSocketOptions): UseSoulWebSocketReturn {
  const [soul, setSoul] = useState<PuppySoul | null>(null); // ✅ 修复: 明确类型
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null); // ✅ 修复: 明确类型
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null); // ✅ 修复: 明确类型
  const memoryCacheRef = useRef<SoulInteractionEvent[]>([]); // ✅ 修复: 明确类型

  const connect = useCallback(() => {
    if (!soulId || wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_ENDPOINT}/${soulId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.info(`[SoulWS] Connected to soul: ${soulId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data: SoulInteractionEvent = JSON.parse(event.data);

        // ✅ 修复: 使用类型守卫进行安全转换 + 填充兼容字段
        if (data.type === 'state_update' && data.payload && isPuppySoul(data.payload)) {
          const payload = data.payload;
          setSoul({
            ...payload,
            name: payload.name || payload.soul_id,
            level: payload.level || 1,
            evolutionStage: payload.evolutionStage || payload.evolution_stage,
            totalInteractions: payload.totalInteractions || payload.total_interactions,
            personality_traits: payload.personality_traits || [],
          });
          onStateUpdate?.(payload);
        }

        memoryCacheRef.current = [data, ...memoryCacheRef.current].slice(0, 50);
        onMessage?.(data);
      } catch (err) {
        console.error('[SoulWS] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      reconnectTimerRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('[SoulWS] Error:', err);
      ws.close();
    };
  }, [soulId, onStateUpdate, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const getRecentMemories = useCallback(async (limit = 20): Promise<SoulInteractionEvent[]> => { // ✅ 修复
    if (memoryCacheRef.current.length >= limit) {
      return memoryCacheRef.current.slice(0, limit);
    }

    try {
      const res = await fetch(`/api/souls/${soulId}/memories?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch memories');
      const memories: SoulInteractionEvent[] = await res.json();
      memoryCacheRef.current = memories;
      return memories;
    } catch (err) {
      console.error('[SoulWS] getRecentMemories fallback failed:', err);
      return memoryCacheRef.current.slice(0, limit);
    }
  }, [soulId]);

  const sendInteraction = useCallback((userInput: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('[SoulWS] Cannot send: not connected');
      return;
    }

    const event: SoulInteractionEvent = {
      type: 'user_input',
      payload: { text: userInput },
      timestamp: new Date().toISOString(),
    };
    wsRef.current.send(JSON.stringify(event));
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    soul,
    isConnected,
    sendInteraction,
    getRecentMemories,
    connect,
    disconnect,
  };
}
