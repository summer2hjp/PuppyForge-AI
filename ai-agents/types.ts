// ai-agents/types.ts
// ========================================
// PuppyForge AI 核心类型定义
// ========================================

/**
 * 基础 Agent 接口
 */
export interface PuppySwarmAgent {
  run(input: any): Promise<any>;
}

/**
 * Agent 执行结果
 */
export interface SwarmResult {
  diagnosis: DiagnosisResult;
  prediction: PredictionResult;
  growthPlan: GrowthPlanResult;
  message: string;
}

/**
 * 诊断结果
 */
export interface DiagnosisResult {
  coreIssues: string[];
  risks: string[];
  emotionVector: EmotionVector;
  confidence: number;
}

/**
 * 情感向量
 */
export interface EmotionVector {
  happiness: number;
  anxiety: number;
  loyalty: number;
}

/**
 * 预测结果
 */
export interface PredictionResult {
  sevenDays: string[];
  thirtyDays: string[];
  interventionWindow: string;
  worstCase: string;
  probability: number;
}

/**
 * 成长计划
 */
export interface GrowthPlanResult {
  dailyTasks: string[];
  personalityDirection: string;
  specialEvent: string;
}

/**
 * 小狗档案
 */
export interface PuppyProfile {
  id: string;
  name: string;
  breed?: string;
  birthDate?: Date;
  gender?: string;
  weightKg?: number;
}

/**
 * 健康记录
 */
export interface HealthRecord {
  id: string;
  puppyId: string;
  recordType: string;
  title?: string;
  description?: string;
  data: Record<string, any>;
  recordedAt: Date;
}

/**
 * AI Agent 交互记录
 */
export interface AgentInteraction {
  id: string;
  puppyId: string;
  agentType: 'diagnosis' | 'prediction' | 'growth';
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  confidence?: number;
  createdAt: Date;
}

/**
 * 视觉分析结果
 */
export interface VisionAnalysisResult {
  breed: string;
  emotionalState: string;
  recommendation: string;
  summary?: string;
}

/**
 * 内存数据
 */
export interface PuppyMemoryData {
  diagnosis?: DiagnosisResult;
  prediction?: PredictionResult;
  growthPlan?: GrowthPlanResult;
}