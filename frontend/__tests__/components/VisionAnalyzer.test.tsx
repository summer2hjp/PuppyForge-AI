import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VisionAnalyzer } from '@/components/VisionAnalyzer';
import { analyzePetImage } from '@/lib/vision';

jest.mock('@/lib/vision');

describe('VisionAnalyzer 系统单元测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常上传宠物图片 - 成功返回trait分析结果 (Happy Path)', async () => {
    // Arrange
    const mockResult = {
      traits: ['energetic', 'loyal', 'playful'],
      confidence: 0.92,
      healthScore: 85,
      recommendations: ['增加户外活动', '监测关节健康'],
    };

    (analyzePetImage as jest.Mock).mockResolvedValue(mockResult);

    const file = new File(['dummy image'], 'puppy.jpg', { type: 'image/jpeg' });

    render(<VisionAnalyzer onAnalysisComplete={jest.fn()} />);

    // Act
    const input = screen.getByTestId('image-upload');
    fireEvent.change(input, { target: { files: [file] } });

    // Assert
    await waitFor(() => {
      expect(analyzePetImage).toHaveBeenCalledWith(file);
      expect(screen.getByText(/energetic/)).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  it('上传无效文件类型 - 显示错误提示 (400场景)', async () => {
    const invalidFile = new File(['dummy'], 'test.txt', { type: 'text/plain' });

    render(<VisionAnalyzer onAnalysisComplete={jest.fn()} />);

    const input = screen.getByTestId('image-upload');
    fireEvent.change(input, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/仅支持JPG|PNG|WEBP格式/)).toBeInTheDocument();
    });
  });

  it('AI分析服务异常 - 优雅降级处理 (500场景)', async () => {
    (analyzePetImage as jest.Mock).mockRejectedValue(new Error('Vision API failed'));

    const file = new File(['dummy'], 'puppy.jpg', { type: 'image/jpeg' });

    render(<VisionAnalyzer onAnalysisComplete={jest.fn()} />);

    const input = screen.getByTestId('image-upload');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/分析失败，请重试/)).toBeInTheDocument();
    });
  });

  it('无图片上传时 - 禁用分析按钮', () => {
    render(<VisionAnalyzer onAnalysisComplete={jest.fn()} />);
    expect(screen.getByRole('button', { name: /开始分析/ })).toBeDisabled();
  });
});
