import { useCallback, useEffect, useRef, useState } from 'react';

// ✅ 1. 严格对齐后端 snake_case 数据契约
export interface PuppySoul {
  soul_id: string;
  evolution_stage: string;
  total_interactions: number;
  trait_vector?: number[];
  last_active_at?: string;
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
  getRecentMemories: (limit?: number) => Promise<SoulInteractionEvent[]>;
  connect: () => void;
  disconnect: () => void;
}

const WS_ENDPOINT = process.env.NEXT_PUBLIC_SOUL_WS_URL || 'ws://localhost:8000/ws/soul';

export function useSoulWebSocket({
  soulId,
  onStateUpdate,
  onMessage,
}: UseSoulWebSocketOptions): UseSoulWebSocketReturn {
  const [soul, setSoul] = useState<PuppySoul | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 缓存近期记忆，避免每次请求都走网络（对应 Symbiosis Gateway 的边缘缓存策略）
  const memoryCacheRef = useRef<SoulInteractionEvent[]>([]);

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
        
        // 处理神经形态状态更新（张量漂移）
        if (data.type === 'state_update' && data.payload) {
          const updatedSoul = data.payload as PuppySoul;
          setSoul(updatedSoul);
          onStateUpdate?.(updatedSoul);
        }

        // 缓存交互事件用于 getRecentMemories
        memoryCacheRef.current = [data, ...memoryCacheRef.current].slice(0, 50);
        onMessage?.(data);
      } catch (err) {
        console.error('[SoulWS] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      // 指数退避重连
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

  // ✅ 2. 补全 app/memory/page.tsx 缺失的 getRecentMemories
  const getRecentMemories = useCallback(async (limit = 20): Promise<SoulInteractionEvent[]> => {
    // 优先返回本地缓存，若不足则通过 REST 回源（Edge-Hybrid 策略）
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

  // 自动连接/断开生命周期
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
