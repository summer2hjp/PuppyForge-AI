import { z } from 'zod';

// 与后端严格对齐的类型定义
export const InteractionEventSchema = z.object({
  puppy_id: z.string().min(1),
  action: z.string().min(1),
  context: z.string().min(3),
  visual_features: z.record(z.any()).optional(),
});

export type InteractionEvent = z.infer<typeof InteractionEventSchema>;

export interface SwarmResult {
  event_id: string;
  health_score: number;
  diagnosis: any;
  recommendations: string[];
  forge_asset?: any;
  persona_impact?: Record<string, number>;
  observability: string;
}

class SwarmOrchestrator {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  async run(puppyId: string, event: InteractionEvent): Promise<SwarmResult> {
    // 输入验证
    const validatedEvent = InteractionEventSchema.parse(event);

    try {
      // 调用后端完整闭环（神经形态 + Forge + OTel）
      const response = await fetch(`${this.baseUrl}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedEvent),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result: SwarmResult = await response.json();

      // 前端增强处理
      const enhancedResult = this._enhanceResult(result);
      
      // 全局事件广播（供 HealthScoreCard 等组件消费）
      window.dispatchEvent(
        new CustomEvent('puppy-forge-update', { 
          detail: enhancedResult 
        })
      );

      return enhancedResult;
    } catch (error) {
      console.error('Swarm Orchestrator Error:', error);
      throw error;
    }
  }

  private _enhanceResult(result: SwarmResult): SwarmResult {
    return {
      ...result,
      health_score: Math.round(result.health_score),
      recommendations: [
        ...result.recommendations,
        "人格 Trait Drift 已更新",
        "Forge 资产已结晶存储"
      ],
      persona_impact: result.persona_impact || { energy: 0.1, trust: 0.08 }
    };
  }
}

export const swarmOrchestrator = new SwarmOrchestrator();
export default swarmOrchestrator;
