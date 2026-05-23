import { DiagnosisAgent } from '../agents/diagnosis-agent';
import { PredictionAgent } from '../agents/prediction-agent';
import { GrowthAgent } from '../agents/growth-agent';
import { PuppyMemory } from '../memory/puppy-long-term-memory';
import { SwarmResult } from '../types';

export class PuppySwarm {
  private diagnosis = new DiagnosisAgent();
  private prediction = new PredictionAgent();
  private growth = new GrowthAgent();
  private memory = new PuppyMemory();

  async runSwarm(puppyId: string, userInput: string, context: any): Promise<SwarmResult> {
    console.log('🚀 Puppy Swarm 核爆启动 - 三核灵魂锻造协议激活');

    const diagnosis = await this.diagnosis.run({ puppyProfile: context.profile, recentLogs: context.logs });
    const prediction = await this.prediction.run({ diagnosis });
    const growthPlan = await this.growth.run({ diagnosis, prediction });

    await this.memory.update(puppyId, { diagnosis, prediction, growthPlan });

    return {
      diagnosis,
      prediction,
      growthPlan,
      message: `汪汪～主人，今天的灵魂锻造计划已生成！${growthPlan.dailyTasks[0]}`
    };
  }
}