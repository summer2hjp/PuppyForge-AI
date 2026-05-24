'use client';

import { ReactNode, useEffect } from 'react';
import { usePuppyStore } from '../store/usePuppyStore';
import { personaWS } from '../lib/websocket-client';

export function Providers({ children }: { children: ReactNode }) {
  const { updateHealthScore, updatePersona, incrementMemories } = usePuppyStore();

  // WebSocket 实时同步到 Zustand
  useEffect(() => {
    const handleRealtimeUpdate = (e: CustomEvent) => {
      const data = e.detail;
      if (data.health_score) updateHealthScore(data.health_score);
      if (data.persona) updatePersona(data.persona);
      if (data.type === 'persona_update') {
        incrementMemories();
      }
    };

    window.addEventListener('persona-realtime-update', handleRealtimeUpdate as EventListener);

    return () => {
      window.removeEventListener('persona-realtime-update', handleRealtimeUpdate as EventListener);
    };
  }, [updateHealthScore, updatePersona, incrementMemories]);

  return <>{children}</>;
}
