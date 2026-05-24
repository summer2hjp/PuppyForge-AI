/**
 * 🧠 PuppyBrain (Durable Object)
 * 
 * 架构定位：神经形态生命体的“边缘灵魂实体”。
 * 职责：
 * 1. 维持与前端的双工 WebSocket 长连接 (利用 Hibernation API 实现百万级并发)。
 * 2. 零信任算力网关：在单线程沙箱内进行绝对原子的 Token 扣减，杜绝并发超卖。
 * 3. 状态维持：记录宠物的短期情绪与“张量漂移 (Trait Drift)”。
 * 4. 边缘路由：将重度多模态推理任务 (VLM/Event Sourcing) 卸载给后端的 FastAPI 集群。
 */

export interface Env {
  // 指向你的 FastAPI 后端 (Docker 容器或公网域名)
  FORGE_API_URL: string; 
  // 用于内部服务间鉴权的密钥
  INTERNAL_API_SECRET: string; 
}

// 定义宠物神经形态状态接口
interface NeuromorphicState {
  mood: string;
  trait_drift: number; // 性格张量漂移值 (随交互不可逆累积)
  last_interaction: number;
}

export class PuppyBrain {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  /**
   * 🚪 边缘网关入口
   * 拦截请求，如果是 WebSocket 升级请求，则建立长连接并允许 DO 休眠。
   */
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket Upgrade', { status: 426 });
    }

    // 创建 WebSocket 对
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // 🚀 核心：使用 Hibernation API 接受连接。
    // 这允许 Cloudflare 在没有消息时卸载 DO 内存，但保持连接不断，完美契合“全球边缘维持灵魂”的设定。
    this.state.acceptWebSocket(server);

    // 返回 101 协议切换响应给客户端
    return new Response(null, { status: 101, webSocket: client });
  }

  /**
   * 📡 接收前端双工消息 (Symbiosis Gateway)
   * 处理视觉打断、多模态交互与算力扣减。
   */
  async webSocketMessage(ws: WebSocket, message: string) {
    let payload: any;
    try {
      payload = JSON.parse(message);
    } catch {
      return ws.send(JSON.stringify({ type: 'ERROR', msg: 'Invalid JSON' }));
    }

    // 🛑 1. 物理级视觉打断 (Barge-in)
    if (payload.type === 'BARGE_IN') {
      // 立即通知后端 FastAPI 取消当前正在进行的 VLM 推理任务 (释放 GPU 算力)
      await this.notifyForgeCancel(payload.session_id);
      return ws.send(JSON.stringify({ type: 'INTERRUPTED', status: 'AWAKE' }));
    }

    // 🗣️ 2. 常规多模态交互 (视觉/音频摄入)
    if (payload.type === 'INTERACTION') {
      const userId = payload.user_id;
      const estimatedCost = payload.estimated_cost || 50; // 预估本次 VLM 推理消耗的 Token

      // 🛡️ 零信任算力网关：原子级扣减
      const hasQuota = await this.deductComputeQuota(userId, estimatedCost);
      if (!hasQuota) {
        return ws.send(JSON.stringify({ 
          type: 'QUOTA_EXCEEDED', 
          msg: '算力耗尽，你的赛博疯狗正在休眠...' 
        }));
      }

      try {
        // 🔄 3. 触发 Event Sourcing / Forge Pipeline
        // 将多模态数据透传给后端 FastAPI，由后端执行 Qdrant 检索与重度 VLM 推理
        const aiResponse = await this.triggerForgePipeline(payload);

        // 🧠 4. 神经形态状态更新 (张量漂移)
        await this.updateNeuromorphicState(aiResponse.drift_value);

        // 📤 5. 边想边说 (流式返回结果给前端)
        ws.send(JSON.stringify({ 
          type: 'SOUL_RESPONSE', 
          data: aiResponse.content,
          mood: aiResponse.new_mood
        }));

      } catch (error) {
        ws.send(JSON.stringify({ type: 'FORGE_ERROR', msg: '后端神经链路断裂' }));
      }
    }
  }

  /**
   * 🗄️ 绝对原子的算力扣减 (杜绝并发超卖)
   * 利用 DO 单线程事件循环特性，无需 Redis Lua 即可实现强一致性限流。
   */
  private async deductComputeQuota(userId: string, cost: number): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `quota_${userId}_${today}`;
    
    // 在 DO 内部，这段代码是串行执行的，天然具备原子性
    const used = (await this.state.storage.get<number>(storageKey)) || 0;
    const dailyLimit = 1000; // 实际应从 Supabase 获取用户的订阅额度

    if (used + cost > dailyLimit) {
      return false; // 超卖拦截
    }

    // 写入新状态，并设置 24 小时 TTL (自动过期)
    await this.state.storage.put(storageKey, used + cost, { expirationTtl: 86400 });
    
    // 📊 AI Soul Telemetry: 异步上报 Token 财务成本到后端 (不阻塞主线程)
    this.ctx.waitUntil(this.reportTelemetry(userId, cost));
    
    return true;
  }

  /**
   * 🧬 更新神经形态状态 (Trait Drift)
   */
  private async updateNeuromorphicState(drift: number) {
    let state = (await this.state.storage.get<NeuromorphicState>('soul_state')) || {
      mood: 'neutral',
      trait_drift: 0,
      last_interaction: Date.now()
    };

    state.trait_drift += drift; // 不可逆的性格漂移
    state.last_interaction = Date.now();
    
    await this.state.storage.put('soul_state', state);
  }

  /**
   * 🚀 呼叫后端 Forge Pipeline
   */
  private async triggerForgePipeline(payload: any): Promise<any> {
    const res = await fetch(`${this.env.FORGE_API_URL}/api/v1/forge/infer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': this.env.INTERNAL_API_SECRET // 边缘到内网的安全校验
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error('Forge Pipeline rejected request');
    return await res.json();
  }

  private async notifyForgeCancel(sessionId: string) {
    await fetch(`${this.env.FORGE_API_URL}/api/v1/forge/cancel/${sessionId}`, {
      method: 'POST',
      headers: { 'X-Internal-Secret': this.env.INTERNAL_API_SECRET }
    });
  }

  private async reportTelemetry(userId: string, cost: number) {
    // 发送到后端的 OpenTelemetry 收集端点，生成“劣质灵魂黑名单”或财务账单
    await fetch(`${this.env.FORGE_API_URL}/api/v1/telemetry/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cost, timestamp: Date.now() })
    });
  }

  // --- WebSocket 生命周期管理 ---
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    console.log(`Soul connection closed: ${code} ${reason}`);
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    console.error(`Soul connection error:`, error);
  }
}
