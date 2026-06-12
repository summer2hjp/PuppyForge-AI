import { render, screen } from '@testing-library/react';
import { getInteractionType } from '@/app/interact/page';

jest.mock('@/hooks/useSoulWebSocket', () => ({
  useSoulWebSocket: () => ({ sendInteraction: jest.fn(), isConnected: true, soul: null }),
}));

jest.mock('@/lib/api-client', () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock('@/components/SoulRadar', () => ({
  __esModule: true,
  default: () => <div data-testid="soul-radar" />,
}));

describe('getInteractionType', () => {
  it('returns "play" for destructive keywords', () => {
    expect(getInteractionType('今天一起去搞破坏吧！')).toBe('play');
  });

  it('returns "affection" for love keywords', () => {
    expect(getInteractionType('我要表达爱！')).toBe('affection');
  });

  it('returns "train" for evolution keywords', () => {
    expect(getInteractionType('我们来促进化吧！')).toBe('train');
  });

  it('returns "talk" as fallback for unknown content', () => {
    expect(getInteractionType('今天天气真不错')).toBe('talk');
  });

  it('returns "talk" for empty string', () => {
    expect(getInteractionType('')).toBe('talk');
  });
});

describe('InteractPage', () => {
  const mockFetchWithAuth = jest.requireMock('@/lib/api-client').fetchWithAuth;

  it('renders the page title', async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true, json: async () => ([]) });
    const InteractPage = (await import('@/app/interact/page')).default;
    render(<InteractPage />);
    expect(screen.getByText('🐕‍🦺 灵魂共振实验室')).toBeInTheDocument();
  });

  it('renders SoulRadar', async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true, json: async () => ([]) });
    const InteractPage = (await import('@/app/interact/page')).default;
    render(<InteractPage />);
    expect(screen.getByTestId('soul-radar')).toBeInTheDocument();
  });

  it('renders quick action buttons', async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true, json: async () => ([]) });
    const InteractPage = (await import('@/app/interact/page')).default;
    render(<InteractPage />);
    expect(screen.getByText('搞破坏')).toBeInTheDocument();
    expect(screen.getByText('表达爱')).toBeInTheDocument();
    expect(screen.getByText('促进化')).toBeInTheDocument();
  });

  it('shows loading state while fetching history', async () => {
    mockFetchWithAuth.mockImplementation(() => new Promise(() => {}));
    const InteractPage = (await import('@/app/interact/page')).default;
    render(<InteractPage />);
    expect(await screen.findByText('加载记录中...')).toBeInTheDocument();
  });

  it('shows empty state when no interactions', async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true, json: async () => ([]) });
    const InteractPage = (await import('@/app/interact/page')).default;
    render(<InteractPage />);
    expect(await screen.findByText('暂无互动记录，开始与宠物对话吧！')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: false, status: 500 });
    const InteractPage = (await import('@/app/interact/page')).default;
    render(<InteractPage />);
    expect(await screen.findByText('请求失败 (500)')).toBeInTheDocument();
  });

  it('shows network error when fetch throws', async () => {
    mockFetchWithAuth.mockRejectedValue(new Error('Network Error'));
    const InteractPage = (await import('@/app/interact/page')).default;
    render(<InteractPage />);
    expect(await screen.findByText('无法连接服务器')).toBeInTheDocument();
  });
});
