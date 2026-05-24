'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePuppySoul } from './usePuppySoul';

export function useSoulWebSocket(soulId: string = 'default_mad_dog') {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { soul, addInteraction: localAddInteraction } = usePuppySoul(soulId);

  const connect = useCallback(() => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      .replace(/^http/, 'ws');
    
    const ws = new WebSocket(`${baseUrl}/ws/soul/${soulId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`🚀 灵魂 ${soulId} 已进入实时共振状态`);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'soul_update') {
          console.log('🌟 接收到实时灵魂漂移:', data.trait_changes);
          // 这里可以触发前端 UI 更新（性格动画等）
        }
      } catch (e) {
        console.error('WebSocket 消息解析失败', e);
      }
    };

    ws.onclose = () => {
      console.log('⚡ 共振通道断开，3秒后尝试重连...');
      setIsConnected(false);
      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };

    return ws;
  }, [soulId]);

  // 自动连接
  useEffect(() => {
    const ws = connect();
    return () => {
      ws.close();
    };
  }, [connect]);

  // 实时发送交互（优先走 WebSocket）
  const sendInteraction = useCallback(async (content: string, action: string = 'chat') => {
    const message = {
      type: 'interaction',
      action,
      content
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      console.log('📡 已通过 WebSocket 实时发送灵魂交互');
    } else {
      // 降级到本地 IndexedDB + HTTP
      console.log('🌐 WebSocket 未连接，降级本地模式');
      await localAddInteraction(content, action);
    }
  }, [localAddInteraction]);

  return {
    sendInteraction,
    isConnected,
    soul
  };
}
