import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DiagnosisModulePanel from '@/components/DiagnosisModule';
import { analyzePetPhoto } from '@/lib/vision-analyzer';

jest.mock('@/lib/vision-analyzer');

const mockFile = new File(['dummy'], 'pet.jpg', { type: 'image/jpeg' });

const mockAnalysis = {
  puppy_id: 'puppy_123',
  description: '测试分析描述',
  timestamp: new Date().toISOString(),
  image_url: 'blob:test',
  breed: '金毛寻回犬',
  emotionalState: '开心活跃',
  recommendation: '保持适度运动',
  summary: '宠物整体健康状况良好',
  healthScore: 85,
  diagnosis: { confidence: 0.94, tags: ['healthy'] },
};

describe('DiagnosisModulePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'blob:test');
  });

  it('renders upload area', () => {
    render(<DiagnosisModulePanel />);
    expect(screen.getByText('点击上传宠物照片')).toBeInTheDocument();
    expect(screen.getByText('AI 视觉诊断')).toBeInTheDocument();
  });

  it('shows error for invalid file type', () => {
    const invalidFile = new File(['dummy'], 'test.txt', { type: 'text/plain' });
    render(<DiagnosisModulePanel />);

    const input = screen.getByTestId('vision-file-input');
    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(screen.getByText('仅支持 JPG、PNG、WEBP 格式的图片')).toBeInTheDocument();
  });

  it('shows preview after file selection', () => {
    render(<DiagnosisModulePanel />);

    const input = screen.getByTestId('vision-file-input');
    fireEvent.change(input, { target: { files: [mockFile] } });

    expect(screen.getByAltText('宠物照片预览')).toBeInTheDocument();
    expect(screen.getByText('开始 AI 健康诊断')).toBeInTheDocument();
  });

  it('displays analyze button after file selected', () => {
    render(<DiagnosisModulePanel />);

    const input = screen.getByTestId('vision-file-input');
    fireEvent.change(input, { target: { files: [mockFile] } });

    expect(screen.getByRole('button', { name: /开始 AI 健康诊断/ })).toBeInTheDocument();
  });

  it('shows loading state during analysis', async () => {
    (analyzePetPhoto as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<DiagnosisModulePanel />);

    const input = screen.getByTestId('vision-file-input');
    fireEvent.change(input, { target: { files: [mockFile] } });

    fireEvent.click(screen.getByRole('button', { name: /开始 AI 健康诊断/ }));

    expect(await screen.findByText('AI 正在分析宠物健康状态...')).toBeInTheDocument();
  });

  it('displays analysis results on success', async () => {
    (analyzePetPhoto as jest.Mock).mockResolvedValue(mockAnalysis);

    render(<DiagnosisModulePanel />);

    const input = screen.getByTestId('vision-file-input');
    fireEvent.change(input, { target: { files: [mockFile] } });

    fireEvent.click(screen.getByRole('button', { name: /开始 AI 健康诊断/ }));

    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('金毛寻回犬')).toBeInTheDocument();
      expect(screen.getByText('开心活跃')).toBeInTheDocument();
      expect(screen.getByText('保持适度运动')).toBeInTheDocument();
      expect(screen.getByText('宠物整体健康状况良好')).toBeInTheDocument();
    });
  });

  it('displays error on analysis failure', async () => {
    (analyzePetPhoto as jest.Mock).mockRejectedValue(new Error('诊断请求失败 (500)'));

    render(<DiagnosisModulePanel />);

    const input = screen.getByTestId('vision-file-input');
    fireEvent.change(input, { target: { files: [mockFile] } });

    fireEvent.click(screen.getByTestId('vision-analyze-btn'));

    expect(await screen.findByText('诊断失败', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('shows health score with emerald color for high score', async () => {
    (analyzePetPhoto as jest.Mock).mockResolvedValue(mockAnalysis);

    render(<DiagnosisModulePanel />);

    const input = screen.getByTestId('vision-file-input');
    fireEvent.change(input, { target: { files: [mockFile] } });

    fireEvent.click(screen.getByRole('button', { name: /开始 AI 健康诊断/ }));

    await waitFor(() => {
      const score = screen.getByText('85');
      expect(score.className).toContain('text-emerald-400');
    });
  });

  it('shows reset button after analysis', async () => {
    (analyzePetPhoto as jest.Mock).mockResolvedValue(mockAnalysis);

    render(<DiagnosisModulePanel />);

    const input = screen.getByTestId('vision-file-input');
    fireEvent.change(input, { target: { files: [mockFile] } });

    fireEvent.click(screen.getByRole('button', { name: /开始 AI 健康诊断/ }));

    await waitFor(() => {
      expect(screen.getByText('重新诊断')).toBeInTheDocument();
    });
  });

  it('resets to initial state when reset is clicked', async () => {
    (analyzePetPhoto as jest.Mock).mockResolvedValue(mockAnalysis);

    render(<DiagnosisModulePanel />);

    const input = screen.getByTestId('vision-file-input');
    fireEvent.change(input, { target: { files: [mockFile] } });

    fireEvent.click(screen.getByRole('button', { name: /开始 AI 健康诊断/ }));

    await waitFor(() => {
      fireEvent.click(screen.getByText('重新诊断'));
    });

    expect(screen.getByText('点击上传宠物照片')).toBeInTheDocument();
  });
});
