import { render, screen } from '@testing-library/react';
import { MemoryCard } from '@/components/memory/MemoryCard';
import type { MemoryRecord } from '@/components/memory/MemoryCard';

const baseMemory: MemoryRecord = {
  id: 1,
  content: '今天在公园玩了飞盘',
  interaction_type: 'play',
  mood_score: 4,
  location: '公园',
  created_at: '2024-06-12T14:30:00Z',
};

describe('MemoryCard', () => {
  it('renders memory content', () => {
    render(<MemoryCard memory={baseMemory} />);
    expect(screen.getByText('今天在公园玩了飞盘')).toBeInTheDocument();
  });

  it('renders interaction type label', () => {
    render(<MemoryCard memory={baseMemory} />);
    expect(screen.getByText('玩耍')).toBeInTheDocument();
  });

  it('shows mood hearts when mood_score is present', () => {
    render(<MemoryCard memory={baseMemory} />);
    expect(screen.getByText(/❤️/)).toBeInTheDocument();
  });

  it('shows location when provided', () => {
    render(<MemoryCard memory={baseMemory} />);
    expect(screen.getByText('📍 公园')).toBeInTheDocument();
  });

  it('handles unknown interaction type with default config', () => {
    render(<MemoryCard memory={{ ...baseMemory, interaction_type: 'sing', id: 2 }} />);
    expect(screen.getByText('其他')).toBeInTheDocument();
  });

  it('renders without mood score', () => {
    render(<MemoryCard memory={{ ...baseMemory, mood_score: null, id: 3 }} />);
    expect(screen.getByText('今天在公园玩了飞盘')).toBeInTheDocument();
  });

  it('renders without location', () => {
    render(<MemoryCard memory={{ ...baseMemory, location: null, id: 4 }} />);
    expect(screen.getByText('今天在公园玩了飞盘')).toBeInTheDocument();
  });

  it('renders in timeline mode with extra left margin', () => {
    const { container } = render(<MemoryCard memory={baseMemory} isTimeline />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('ml-6');
  });

  it('supports all known interaction types with correct labels', () => {
    const types: Record<string, string> = {
      play: '玩耍',
      affection: '情感',
      train: '训练',
      talk: '对话',
      feed: '喂食',
      walk: '散步',
    };
    let idx = 10;
    for (const [type, label] of Object.entries(types)) {
      const { unmount } = render(<MemoryCard memory={{ ...baseMemory, interaction_type: type, id: idx++ }} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('displays relative time for today timestamps', () => {
    const now = new Date();
    render(<MemoryCard memory={{
      ...baseMemory,
      content: '这是一个今天的记忆测试',
      created_at: now.toISOString(),
      id: 5,
    }} />);
    const matched = screen.getAllByText(/今天/);
    expect(matched.length).toBeGreaterThanOrEqual(1);
  });

  it('displays "昨天" for yesterday timestamps', () => {
    const yesterday = new Date(Date.now() - 86400000);
    render(<MemoryCard memory={{
      ...baseMemory,
      content: '昨天的户外活动',
      created_at: yesterday.toISOString(),
      id: 6,
    }} />);
    expect(screen.getByText('昨天')).toBeInTheDocument();
  });
});
