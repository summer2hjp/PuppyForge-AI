import { z } from 'zod';
import { SwarmResult } from './types';

// 类型定义（与后端严格对齐）
export const InteractionEventSchema = z.object({
  puppy_id: z.string(),
  action: z.string(),
  context: z.string(),
});

export type InteractionEvent = z.infer<typeof InteractionEventSchema>;

class SwarmOrchestrator {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  async run(puppyId: string, input: InteractionEvent): Promise<SwarmResult> {
    // 1. 调用后端统一互动接口（神经形态 + Forge 全闭环）
    const response = await fetch(`${this.baseUrl}/api/v1/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error('Swarm orchestration failed');

    const data = await response.json();

    // 2. 前端本地二次编排（轻量 Agent 层）
    const enhanced = await this._localEnhance(data);

    // 3. 触发前端状态更新与通知
    this._notifyUI(enhanced);

    return enhanced;
  }

  private async _localEnhance(data: any): Promise<SwarmResult> {
    return {
      ...data,
      health_score: data.health_score || 85,
      persona_impact: data.persona_impact || { energy: 0.12 },
      recommendations: [
        ...data.recommendations,
        "建议记录每日行为日志以增强记忆演化"
      ]
    };
  }

  private _notifyUI(result: SwarmResult) {
    // 集成 Toast / 全局状态更新
    window.dispatchEvent(new CustomEvent('puppy-forge-update', { detail: result }));
  }
}

export const swarmOrchestrator = new SwarmOrchestrator();
export default swarmOrchestrator;
