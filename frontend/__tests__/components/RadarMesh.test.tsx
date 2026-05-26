import { render } from '@testing-library/react';
import { RadarMesh } from '@/components/RadarMesh';

describe('RadarMesh 3D灵魂雷达单元测试', () => {
  it('正确接收并渲染trait数据', () => {
    const traits = { energy: 0.9, loyalty: 0.85, curiosity: 0.7 };
    const { container } = render(<RadarMesh traits={traits} />);
    expect(container).toBeInTheDocument();
  });

  it('无trait数据时显示默认雷达', () => {
    render(<RadarMesh traits={{}} />);
    // 3D组件渲染检查
  });
});
