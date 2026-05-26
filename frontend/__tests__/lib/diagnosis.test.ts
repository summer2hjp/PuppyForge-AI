import { generateDiagnosisReport } from '@/lib/diagnosis';
import { analyzePetImage } from '@/lib/vision';

jest.mock('@/lib/vision');

describe('DiagnosisModule 诊断系统单元测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常生成诊断报告 - 包含PuppySoul trait漂移分析 (Happy Path)', async () => {
    const mockAnalysisData = {
      traits: ['energetic', 'loyal'],
      healthScore: 88,
    };

    const mockReport = {
      healthScore: 88,
      soulTraits: { energy: 0.92, loyalty: 0.87, curiosity: 0.65 },
      driftPrediction: '未来7天精力值可能提升8%',
      recommendations: ['每日增加30分钟户外活动', '补充Omega-3营养'],
      riskLevel: 'low',
    };

    (analyzePetImage as jest.Mock).mockResolvedValue(mockAnalysisData);

    const result = await generateDiagnosisReport('puppy-123', mockAnalysisData);

    expect(result).toEqual(mockReport);
    expect(result.soulTraits.energy).toBeGreaterThan(0.9);
  });

  it('低健康分数 - 触发高风险trait漂移预警', async () => {
    const lowHealthData = { traits: ['anxious'], healthScore: 42 };

    const result = await generateDiagnosisReport('puppy-456', lowHealthData);

    expect(result.riskLevel).toBe('high');
    expect(result.driftPrediction).toContain('焦虑');
  });

  it('API异常 - 返回优雅降级报告', async () => {
    (analyzePetImage as jest.Mock).mockRejectedValue(new Error('Vision service unavailable'));

    const result = await generateDiagnosisReport('puppy-789', {});

    expect(result.healthScore).toBe(50);
    expect(result.recommendations).toContain('请检查网络连接并重试');
  });

  it('空数据输入 - 返回默认安全报告', async () => {
    const result = await generateDiagnosisReport('puppy-empty', null);
    expect(result.healthScore).toBe(60);
    expect(result.soulTraits).toBeDefined();
  });
});
