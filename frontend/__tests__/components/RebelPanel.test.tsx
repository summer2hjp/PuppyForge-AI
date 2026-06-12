import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RebelPanel from '@/components/RebelPanel';

jest.mock('@/store/usePuppyStore', () => ({
  usePuppyStore: jest.fn(),
}));

const mockSoul = {
  id: 1,
  name: '小奶狗',
  breed: null,
  level: 3,
  soul_fuel: 75,
  total_interactions: 42,
  evolution_stage: 'puppy',
  traits: {
    affection: 70,
    loyalty: 80,
    curiosity: 60,
    intelligence: 50,
    chaos: 40,
    aggression: 30,
    rebellion: 65,
  },
  health_score: 85,
};

describe('RebelPanel', () => {
  const mockAddRebelSuggestion = jest.fn();
  const mockUsePuppyStore = jest.requireMock('@/store/usePuppyStore').usePuppyStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePuppyStore.mockImplementation((selector: any) =>
      selector({ addRebelSuggestion: mockAddRebelSuggestion }),
    );
  });

  it('renders the rebel agent header', () => {
    render(<RebelPanel soul={mockSoul} />);
    expect(screen.getByText('Rebel Agent')).toBeInTheDocument();
  });

  it('shows simulation notice badge', () => {
    render(<RebelPanel soul={mockSoul} />);
    expect(screen.getByText(/客户端模拟/)).toBeInTheDocument();
  });

  it('shows initial hint message', () => {
    render(<RebelPanel soul={mockSoul} />);
    expect(
      screen.getByText('👆 点击上方按钮，唤醒宠物的反叛因子'),
    ).toBeInTheDocument();
  });

  it('renders the trigger button', () => {
    render(<RebelPanel soul={mockSoul} />);
    expect(screen.getByText('唤醒 Rebel 模式')).toBeInTheDocument();
  });

  it('shows thinking state on click', async () => {
    const user = userEvent.setup();
    render(<RebelPanel soul={mockSoul} />);

    await user.click(screen.getByTestId('rebel-trigger-btn'));
    expect(await screen.findByText('正在叛逆思考...')).toBeInTheDocument();
  });

  it('displays rebel result based on soul traits', async () => {
    const user = userEvent.setup();
    render(<RebelPanel soul={mockSoul} />);

    await user.click(screen.getByTestId('rebel-trigger-btn'));

    await waitFor(() => {
      expect(screen.getByText('叛逆输出')).toBeInTheDocument();
      expect(screen.getByText(/\/10/)).toBeInTheDocument();
    });
  });

  it('calls addRebelSuggestion from store', async () => {
    const user = userEvent.setup();
    render(<RebelPanel soul={mockSoul} />);

    await user.click(screen.getByTestId('rebel-trigger-btn'));

    await waitFor(() => {
      expect(mockAddRebelSuggestion).toHaveBeenCalled();
    });
  });

  it('generates different suggestion for high rebellion soul', async () => {
    const user = userEvent.setup();
    const highRebelSoul = {
      ...mockSoul,
      traits: { ...mockSoul.traits, rebellion: 90 },
    };
    render(<RebelPanel soul={highRebelSoul} />);

    await user.click(screen.getByTestId('rebel-trigger-btn'));

    await waitFor(() => {
      expect(screen.getByText(/数据可视化|仪表盘/)).toBeInTheDocument();
    });
  });
});
