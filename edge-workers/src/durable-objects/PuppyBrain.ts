import { DurableObject } from "cloudflare:workers";

export class PuppyBrainDO extends DurableObject {
  private sessions = new Set<WebSocket>();

  async fetch(request: Request): Promise<Response> {
    // 处理 WebSocket 升级 (多模态共生网关)
    if (request.headers.get("Upgrade") === "websocket") {
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      this.sessions.add(server);
      
      // 可以在这里直接运行 WASM 或调用 CF Workers AI
      return new Response(null, { status: 101, webSocket: client });
    }

    // 处理普通状态交互
    const event = await request.json();
    
    // 写入 DO 内置的持久化存储 (SQLite 级别)
    await this.ctx.storage.put(`event:${Date.now()}`, event);
    
    // 广播给所有连接的前端 (实时渲染)
    const msg = JSON.stringify({ type: "state_update", data: event });
    for (const ws of this.sessions) {
      try { ws.send(msg); } catch { this.sessions.delete(ws); }
    }

    return new Response("Ingested");
  }

  // 处理 WebSocket 消息 (视觉/语音流)
  async webSocketMessage(ws: WebSocket, message: ArrayBuffer) {
    // 处理多模态二进制流，触发 AI 推理
    ws.send("Woof! (Edge AI processing...)"); 
  }
}
