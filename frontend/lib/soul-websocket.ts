type TraitUpdate = Record<string, unknown>;
type TraitUpdateCallback = (traits: TraitUpdate) => void;

export function useSoulWebSocket(_petId: string, onTraitUpdate?: TraitUpdateCallback) {
  let socket: WebSocket | null = null;

  const connect = () => {
    socket = new WebSocket('ws://localhost/soul');
    socket.send(JSON.stringify({ type: 'subscribe' }));
    socket.onopen = () => {
      socket?.send(JSON.stringify({ type: 'subscribe' }));
    };
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { traits?: TraitUpdate };
        onTraitUpdate?.(payload.traits ?? {});
      } catch {
        onTraitUpdate?.({});
      }
    };
    socket.onclose = (event) => {
      if (event.code === 1006) {
        socket = new WebSocket('ws://localhost/soul');
      }
    };
  };

  const sendTraitUpdate = (traits: TraitUpdate) => {
    socket?.send(JSON.stringify(traits));
  };

  const disconnect = () => {
    socket?.close();
  };

  return { connect, sendTraitUpdate, disconnect };
}
