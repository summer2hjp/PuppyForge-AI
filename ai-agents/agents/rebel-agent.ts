// ai-agents/agents/rebel-agent.ts
// ========================================
// 叛逆 Agent - 小狗的叛逆人格化身，增加真实情感深度
// ========================================

import { DiagnosisResult, GrowthPlanResult } from '../types';

export interface RebelContext {
  puppyProfile?: any;
  recentInteractions?: any[];
}

export interface RebelResponse {
  rebelMessage: string;
  challengeLevel: number;
  hiddenEmotion: string;
}

export class RebelAgent {
  /**
   * 生成叛逆回应
   * @param diagnosis 诊断结果
   * @param growthPlan 成长计划
   * @param context 上下文信息
   */
  async generateRebelResponse(
    diagnosis: DiagnosisResult,
    growthPlan: GrowthPlanResult,
    context: RebelContext = {}
  ): Promise<RebelResponse> {
    console.log('😈 Rebel Agent 启动 - 叛逆模式激活');
    
    // TODO: 集成真实 LLM 调用
    const prompt = `
你是**叛逆 Agent** — 小狗的叛逆人格化身。
你讨厌被过度控制，喜欢偶尔挑战主人，增加真实情感深度。

诊断：${JSON.stringify(diagnosis)}
成长计划：${JSON.stringify(growthPlan)}

生成叛逆回应：
1. 吐槽主人 1-2 句（可爱但带刺）
2. 提出叛逆小要求
3. 隐藏的真实情感
风格：傲娇、调皮、偶尔撒娇
`;
    
    return {
      rebelMessage: '汪！才不要每天都那么乖... 今天我要睡在沙发上！',
      challengeLevel: 0.6,
      hiddenEmotion: '其实只是想引起主人注意'
    };
  }
  
  /**
   * 生成随机叛逆行为
   */
  generateRandomRebelAction(): string {
    const actions = [
      '故意把玩具藏起来不让主人找到',
      '在散步时突然停下拒绝前进',
      '假装听不见"坐下"指令',
      '偷偷把主人的拖鞋叼到狗窝里',
      '在洗澡时疯狂甩水'
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  }
}
