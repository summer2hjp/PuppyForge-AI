import { useState, useEffect, useCallback } from 'react';

interface PuppySoul {
  id: string;
  name: string;
  level: number;
  traits: any;
  rebellion_score: number;
  soul_fuel: number;
  memories: any[];
}

export function usePuppySoul(soulId: string) {
  const [soul, setSoul] = useState<PuppySoul | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/soul/${soulId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log(`🐾 Soul ${soulId} connected`);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'soul_update') {
        setSoul(data.soul);
      }
    };

    ws.onclose = () => setIsConnected(false);
    ws.onerror = (err) => console.error("SoulRadar WS Error:", err);
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

  return { soul, isConnected, connect, disconnect, sendInteraction };
}
