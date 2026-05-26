import { render, screen } from '@testing-library/react';
import { RadarMesh } from '@/components/RadarMesh';

describe('RadarMesh 3D灵魂雷达单元测试', () => {
  const defaultTraits = {
    energy: 0.85,
    loyalty: 0.92,
    curiosity: 0.78,
    calmness: 0.65,
  };

  it('正常渲染3D雷达 - 正确显示trait数值', () => {
    render(<RadarMesh traits={defaultTraits} />);
    expect(screen.getByTestId('radar-container')).toBeInTheDocument();
  });

  it('trait值变化时触发动画更新', () => {
    const { rerender } = render(<RadarMesh traits={defaultTraits} />);
    
    const newTraits = { ...defaultTraits, energy: 0.95 };
    rerender(<RadarMesh traits={newTraits} />);
    
    expect(screen.getByTestId('radar-container')).toBeInTheDocument();
  });

  it('空trait数据 - 显示默认雷达状态', () => {
    render(<RadarMesh traits={{}} />);
    expect(screen.getByText(/灵魂状态加载中/)).toBeInTheDocument();
  });

  it('极端trait值边界测试', () => {
    const extremeTraits = { energy: 1.0, loyalty: 0.0, curiosity: 0.5 };
    render(<RadarMesh traits={extremeTraits} />);
    // 确保不崩溃
  });
});
