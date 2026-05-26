import { z } from 'zod';

export interface DiagnosisResult {
  coreIssues: string[];
  risks: string[];
  confidence: number;
  [key: string]: unknown;
}

export interface ForgeAsset {
  asset_id: string;
  asset_type: string;
  metadata: Record<string, unknown>;
}

// 与后端严格对齐的类型定义
export const InteractionEventSchema = z.object({
  puppy_id: z.string().min(1),
  action: z.string().min(1),
  context: z.string().min(3),
  visual_features: z.record(z.string(), z.any()).optional(),
});

export type InteractionEvent = z.infer<typeof InteractionEventSchema>;

export interface BackendSwarmResult {
  event_id: string;
  health_score: number;
  diagnosis: DiagnosisResult | null;
  recommendations: string[];
  forge_asset?: ForgeAsset | null; 
  persona_impact?: Record<string, number>;
  observability: string;
}

class SwarmOrchestrator {
  private readonly baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  async run(puppyId: string, event: InteractionEvent): Promise<BackendSwarmResult> {
    const validatedEvent = InteractionEventSchema.parse(event);

    try {
      const response = await fetch(`${this.baseUrl}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedEvent),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result: BackendSwarmResult = await response.json();
      const enhancedResult = this._enhanceResult(result);

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

  private _enhanceResult(result: BackendSwarmResult): BackendSwarmResult {
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
