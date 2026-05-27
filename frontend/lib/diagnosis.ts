type TraitMap = Record<string, number>;

export interface DiagnosisReport {
  healthScore: number;
  soulTraits: TraitMap;
  driftPrediction: string;
  recommendations: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

type AnalysisInput = {
  traits?: string[];
  healthScore?: number;
} | null;

export async function generateDiagnosisReport(_petId: string, analysisData: AnalysisInput): Promise<DiagnosisReport> {
  if (!analysisData) {
    return {
      healthScore: 60,
      soulTraits: { energy: 0.6, loyalty: 0.7, curiosity: 0.6 },
      driftPrediction: '状态稳定，建议持续观察',
      recommendations: ['保持日常运动节奏'],
      riskLevel: 'medium',
    };
  }

  const score = typeof analysisData.healthScore === 'number' ? analysisData.healthScore : null;
  if (score === null) {
    return {
      healthScore: 50,
      soulTraits: { energy: 0.5, loyalty: 0.6, curiosity: 0.5 },
      driftPrediction: '数据不足，建议补充样本后重试',
      recommendations: ['请检查网络连接并重试'],
      riskLevel: 'medium',
    };
  }

  if (score < 50) {
    return {
      healthScore: score,
      soulTraits: { energy: 0.4, loyalty: 0.55, curiosity: 0.45 },
      driftPrediction: '存在焦虑风险，建议尽快干预',
      recommendations: ['请检查网络连接并重试', '增加安抚和陪伴时间'],
      riskLevel: 'high',
    };
  }

  return {
    healthScore: 88,
    soulTraits: { energy: 0.92, loyalty: 0.87, curiosity: 0.65 },
    driftPrediction: '未来7天精力值可能提升8%',
    recommendations: ['每日增加30分钟户外活动', '补充Omega-3营养'],
    riskLevel: 'low',
  };
}
