class PersonaWebSocketClient {
  private ws: WebSocket | null = null;
  private puppyId: string;
  private reconnectAttempts = 0;
  private maxReconnects = 6;
  private pingInterval?: NodeJS.Timeout;

  constructor(puppyId: string = "p001") {
    this.puppyId = puppyId;
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8000';
    
    this.ws = new WebSocket(`${protocol}//${host}/ws/persona/${this.puppyId}`);

    this.ws.onopen = () => {
      console.log(`[PersonaWS] 已连接实时人格通道: ${this.puppyId}`);
      this.reconnectAttempts = 0;
      
      // 心跳
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send("ping");
        }
      }, 25000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'persona_update') {
          window.dispatchEvent(new CustomEvent('persona-realtime-update', { 
            detail: data 
          }));
        }
      } catch (e) {
        console.error("WebSocket 消息解析失败", e);
      }
    };

    this.ws.onclose = () => {
      console.log(`[PersonaWS] 连接断开，尝试重连...`);
      if (this.pingInterval) clearInterval(this.pingInterval);
      if (this.reconnectAttempts < this.maxReconnects) {
        setTimeout(() => this.connect(), 1800);
        this.reconnectAttempts++;
      }
    };

    this.ws.onerror = (error) => {
      console.error("[PersonaWS] 错误:", error);
    };
  }

  public disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.ws?.close();
  }
}

export const personaWS = new PersonaWebSocketClient("p001");
export default personaWS;
