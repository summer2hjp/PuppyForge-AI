import { useState, useEffect, useRef, useCallback } from 'react';

interface PuppySoul {
  id: string;
  name: string;
  level: number;
  traits: any;
  rebellion_score: number;
  soul_fuel: number;
  memories: any[];
  evolution_stage: string;
}

export function usePuppySoul(soulId: string) {
  const [soul, setSoul] = useState<PuppySoul | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('puppy_token');
    const protocol = token ? `Bearer ${token}` : '';

    const ws = new WebSocket(`ws://localhost:8000/ws/soul/${soulId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log(`🐾 Soul ${soulId} WebSocket 已连接`);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'soul_update') {
        setSoul(data.soul);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log(`❌ Soul ${soulId} 连接断开`);
    };

    ws.onerror = (error) => console.error("WebSocket Error:", error);
  }, [soulId]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  const sendInteraction = useCallback((userInput: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "interact",
        payload: { user_input: userInput }
      }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    soul,
    isConnected,
    sendInteraction,
    connect,
    disconnect
  };
}
