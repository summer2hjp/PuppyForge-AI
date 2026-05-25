// ai-agents/core/swarm-orchestrator.ts
// ========================================
// Puppy Swarm 核心编排器 - 三核灵魂锻造协议
// ========================================

import { DiagnosisAgent } from '../agents/diagnosis-agent';
import { PredictionAgent } from '../agents/prediction-agent';
import { GrowthAgent } from '../agents/growth-agent';
import { RebelAgent } from '../agents/rebel-agent';
import { PuppyMemory } from '../memory/puppy-long-term-memory';
import { 
  type SwarmResult, 
  type DiagnosisResult, 
  type PredictionResult, 
  type GrowthPlanResult,
  type PuppyProfile 
} from '../types';

export interface SwarmContext {
  profile: PuppyProfile;
  logs: any[];
  includeRebel?: boolean;
}

export class PuppySwarm {
  private diagnosis: DiagnosisAgent;
  private prediction: PredictionAgent;
  private growth: GrowthAgent;
  private rebel: RebelAgent;
  private memory: PuppyMemory;

  constructor() {
    this.diagnosis = new DiagnosisAgent();
    this.prediction = new PredictionAgent();
    this.growth = new GrowthAgent();
    this.rebel = new RebelAgent();
    this.memory = new PuppyMemory();
  }

  /**
   * 执行完整的 Swarm 流程
   */
  async runSwarm(
    puppyId: string, 
    userInput: string, 
    context: SwarmContext
  ): Promise<SwarmResult> {
    console.log('🚀 Puppy Swarm 核爆启动 - 三核灵魂锻造协议激活');

    // Step 1: 灵魂诊断
    const diagnosis: DiagnosisResult = await this.diagnosis.run({
      puppyProfile: context.profile,
      recentLogs: context.logs
    });

    // Step 2: 未来预测
    const prediction: PredictionResult = await this.prediction.run({
      diagnosis
    });

    // Step 3: 成长方案
    const growthPlan: GrowthPlanResult = await this.growth.run({
      diagnosis,
      prediction
    });

    // Step 4 (可选): 叛逆回应
    let rebelMessage = '';
    if (context.includeRebel) {
      const rebelResponse = await this.rebel.generateRebelResponse(
        diagnosis,
        growthPlan,
        { puppyProfile: context.profile }
      );
      rebelMessage = ` 😈 ${rebelResponse.rebelMessage}`;
    }

    // Step 5: 更新记忆
    await this.memory.update(puppyId, { 
      diagnosis, 
      prediction, 
      growthPlan 
    });

    return {
      diagnosis,
      prediction,
      growthPlan,
      message: `汪汪～主人，今天的灵魂锻造计划已生成！${growthPlan.dailyTasks[0]}${rebelMessage}`
    };
  }

  /**
   * 仅执行诊断
   */
  async runDiagnosis(context: SwarmContext): Promise<DiagnosisResult> {
    return this.diagnosis.run({
      puppyProfile: context.profile,
      recentLogs: context.logs
    });
  }

  /**
   * 获取记忆趋势分析
   */
  async getTrendAnalysis(puppyId: string) {
    return this.memory.getTrendAnalysis(puppyId);
  }

  /**
   * 获取完整记忆历史
   */
  async getMemoryHistory(puppyId: string) {
    return this.memory.getHistory(puppyId);
  }
}
