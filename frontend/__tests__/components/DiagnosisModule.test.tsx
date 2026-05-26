import { render, screen, waitFor } from '@testing-library/react';
import { DiagnosisModule } from '@/components/DiagnosisModule';
import { generateDiagnosisReport } from '@/lib/diagnosis';

jest.mock('@/lib/diagnosis');

describe('DiagnosisModule 系统单元测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常生成诊断报告 - 包含PuppySoul trait漂移分析', async () => {
    const mockReport = {
      healthScore: 88,
      soulTraits: { energy: 0.9, loyalty: 0.85, curiosity: 0.75 },
      driftPrediction: '未来7天精力值可能提升12%',
      recommendations: ['补充Omega-3', '每日30分钟互动'],
    };

    (generateDiagnosisReport as jest.Mock).mockResolvedValue(mockReport);

    render(<DiagnosisModule petId="puppy-123" analysisData={{ traits: [] }} />);

    await waitFor(() => {
      expect(screen.getByText('88')).toBeInTheDocument();
      expect(screen.getByText(/精力值可能提升/)).toBeInTheDocument();
    });
  });

  it('trait漂移预测边界测试 - 低健康分数', async () => {
    const lowHealthReport = {
      healthScore: 45,
      soulTraits: { energy: 0.3 },
      driftPrediction: '警告：可能出现焦虑倾向',
    };

    (generateDiagnosisReport as jest.Mock).mockResolvedValue(lowHealthReport);

    render(<DiagnosisModule petId="puppy-456" analysisData={{ traits: [] }} />);

    await waitFor(() => {
      expect(screen.getByText(/焦虑倾向/)).toBeInTheDocument();
    });
  });

  it('API异常 - 显示友好错误信息', async () => {
    (generateDiagnosisReport as jest.Mock).mockRejectedValue(new Error('Diagnosis failed'));

    render(<DiagnosisModule petId="puppy-789" analysisData={{ traits: [] }} />);

    await waitFor(() => {
      expect(screen.getByText(/诊断服务暂时不可用/)).toBeInTheDocument();
    });
  });
});
