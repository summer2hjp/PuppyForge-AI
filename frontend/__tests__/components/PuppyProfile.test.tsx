import { render, screen } from '@testing-library/react';
import { PuppyProfile } from '@/components/PuppyProfile';

describe('PuppyProfile 系统单元测试', () => {
  const mockPet = {
    id: 'puppy-123',
    name: '小奶狗',
    traits: ['energetic', 'loyal'],
    healthScore: 92,
  };

  it('正确渲染宠物档案信息', () => {
    render(<PuppyProfile pet={mockPet} />);
    expect(screen.getByText('小奶狗')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('无宠物数据时显示加载状态', () => {
    render(<PuppyProfile pet={null} />);
    expect(screen.getByText(/加载中/)).toBeInTheDocument();
  });
});
