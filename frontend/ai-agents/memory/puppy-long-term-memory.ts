// ai-agents/memory/puppy-long-term-memory.ts
// ========================================
// 小狗长期记忆模块 - 存储和管理成长历史
// ========================================

import { type PuppyMemoryData, type DiagnosisResult, type PredictionResult, type GrowthPlanResult } from '../types';

export interface MemorySnapshot {
  timestamp: Date;
  diagnosis?: DiagnosisResult;
  prediction?: PredictionResult;
  growthPlan?: GrowthPlanResult;
}

export class PuppyMemory {
  private memoryStore: Map<string, MemorySnapshot[]> = new Map();

  /**
   * 获取小狗记忆摘要
   */
  async getSummary(puppyId: string): Promise<string> {
    const snapshots = this.memoryStore.get(puppyId) || [];
    if (snapshots.length === 0) {
      return '暂无记忆数据';
    }
    
    const latest = snapshots[snapshots.length - 1];
    return `最新诊断：${latest.diagnosis?.coreIssues.join(', ') || '无'}`;
  }

  /**
   * 更新小狗记忆
   */
  async update(
    puppyId: string, 
    data: PuppyMemoryData
  ): Promise<void> {
    console.log(`💾 更新 ${puppyId} 的记忆...`);
    
    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      ...data
    };
    
    const existingSnapshots = this.memoryStore.get(puppyId) || [];
    existingSnapshots.push(snapshot);
    
    // 保留最近 10 条记录
    if (existingSnapshots.length > 10) {
      existingSnapshots.shift();
    }
    
    this.memoryStore.set(puppyId, existingSnapshots);
  }

  /**
   * 获取完整记忆历史
   */
  async getHistory(puppyId: string): Promise<MemorySnapshot[]> {
    return this.memoryStore.get(puppyId) || [];
  }

  /**
   * 清除指定小狗的记忆
   */
  async clear(puppyId: string): Promise<void> {
    this.memoryStore.delete(puppyId);
    console.log(`🗑️ 已清除 ${puppyId} 的记忆`);
  }

  /**
   * 获取趋势分析（基于历史记忆）
   */
  async getTrendAnalysis(puppyId: string): Promise<{
    anxietyTrend: 'improving' | 'worsening' | 'stable';
    progressScore: number;
  }> {
    const history = await this.getHistory(puppyId);
    
    if (history.length < 2) {
      return { anxietyTrend: 'stable', progressScore: 50 };
    }
    
    const firstAnxiety = history[0].diagnosis?.emotionVector.anxiety || 0.5;
    const lastAnxiety = history[history.length - 1].diagnosis?.emotionVector.anxiety || 0.5;
    
    const trend: 'improving' | 'worsening' | 'stable' = 
      lastAnxiety < firstAnxiety ? 'improving' :
      lastAnxiety > firstAnxiety ? 'worsening' : 'stable';
    
    const progressScore = Math.round((1 - lastAnxiety) * 100);
    
    return { anxietyTrend: trend, progressScore };
  }
}
