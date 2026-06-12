import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryTimeline } from '@/components/memory/MemoryTimeline';
import type { MemoryRecord } from '@/components/memory/MemoryCard';

const mockMemories: MemoryRecord[] = [
  {
    id: 1,
    content: '第一次学会握手！',
    interaction_type: 'train',
    mood_score: 5,
    location: '客厅',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    content: '发现了藏在沙发下的玩具',
    interaction_type: 'play',
    mood_score: 3,
    location: null,
    created_at: '2024-01-14T15:20:00Z',
  },
  {
    id: 3,
    content: '温柔地摸了摸头',
    interaction_type: 'affection',
    mood_score: null,
    location: '阳台',
    created_at: '2024-01-13T09:00:00Z',
  },
];

describe('MemoryTimeline', () => {
  it('renders loading state', () => {
    render(<MemoryTimeline memories={[]} isLoading error={null} />);
    expect(screen.getByText('正在加载记忆...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<MemoryTimeline memories={[]} isLoading={false} error="无法连接服务器" />);
    expect(screen.getByText('无法连接服务器')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<MemoryTimeline memories={[]} isLoading={false} error={null} />);
    expect(screen.getByText('暂无记忆记录')).toBeInTheDocument();
  });

  it('renders memories in timeline view', () => {
    render(<MemoryTimeline memories={mockMemories} isLoading={false} error={null} />);
    expect(screen.getByText('第一次学会握手！')).toBeInTheDocument();
    expect(screen.getByText('发现了藏在沙发下的玩具')).toBeInTheDocument();
    expect(screen.getByText('温柔地摸了摸头')).toBeInTheDocument();
    expect(screen.getByText('共 3 条')).toBeInTheDocument();
  });

  it('toggles to list view on button click', async () => {
    const user = userEvent.setup();
    render(<MemoryTimeline memories={mockMemories} isLoading={false} error={null} />);

    await user.click(screen.getByText('列表'));
    expect(screen.getByText('第一次学会握手！')).toBeInTheDocument();
    expect(screen.getByText('发现了藏在沙发下的玩具')).toBeInTheDocument();
  });

  it('displays type labels for all memories', () => {
    render(<MemoryTimeline memories={mockMemories} isLoading={false} error={null} />);
    expect(screen.getByText('训练')).toBeInTheDocument();
    expect(screen.getByText('玩耍')).toBeInTheDocument();
    expect(screen.getByText('情感')).toBeInTheDocument();
  });

  it('displays location info when present', () => {
    render(<MemoryTimeline memories={mockMemories} isLoading={false} error={null} />);
    expect(screen.getByText('📍 客厅')).toBeInTheDocument();
    expect(screen.getByText('📍 阳台')).toBeInTheDocument();
  });
});
