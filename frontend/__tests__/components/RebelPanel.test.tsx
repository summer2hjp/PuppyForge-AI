import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RebelPanel from '@/components/RebelPanel';

jest.mock('@/lib/api-client', () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock('@/store/usePuppyStore', () => ({
  usePuppyStore: jest.fn(),
}));

describe('RebelPanel', () => {
  const mockFetchWithAuth = jest.requireMock('@/lib/api-client').fetchWithAuth;
  const mockAddRebelSuggestion = jest.fn();
  const mockUsePuppyStore = jest.requireMock('@/store/usePuppyStore').usePuppyStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePuppyStore.mockImplementation((selector: any) =>
      selector({ addRebelSuggestion: mockAddRebelSuggestion })
    );
  });

  it('renders the rebel agent header', () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<RebelPanel />);
    expect(screen.getByText('Rebel Agent')).toBeInTheDocument();
  });

  it('shows initial hint message', () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<RebelPanel />);
    expect(screen.getByText('👆 点击上方按钮，唤醒宠物的反叛因子')).toBeInTheDocument();
  });

  it('renders the trigger button', () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<RebelPanel />);
    expect(screen.getByText('唤醒 Rebel 模式')).toBeInTheDocument();
  });

  it('shows thinking state on click', async () => {
    mockFetchWithAuth.mockImplementation(() => new Promise(() => {}));
    render(<RebelPanel />);

    fireEvent.click(screen.getByTestId('rebel-trigger-btn'));
    expect(await screen.findByText('正在叛逆思考...')).toBeInTheDocument();
  });

  it('displays rebel result on success', async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ level: 5, name: '测试' }),
    });

    render(<RebelPanel />);
    fireEvent.click(screen.getByTestId('rebel-trigger-btn'));

    await waitFor(() => {
      expect(screen.getByText('叛逆输出')).toBeInTheDocument();
    });
  });

  it('shows rebel factor and risk level', async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ level: 5, name: '测试' }),
    });

    render(<RebelPanel />);
    fireEvent.click(screen.getByTestId('rebel-trigger-btn'));

    await waitFor(() => {
      expect(screen.getByText(/\/10/)).toBeInTheDocument();
    });
  });

  it('displays error on API failure', async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: false, status: 500 });

    render(<RebelPanel />);
    fireEvent.click(screen.getByTestId('rebel-trigger-btn'));

    await waitFor(() => {
      expect(screen.getByText(/请求失败/)).toBeInTheDocument();
    });
  });

  it('calls addRebelSuggestion from store', async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ level: 5, name: '测试' }),
    });

    render(<RebelPanel />);
    fireEvent.click(screen.getByTestId('rebel-trigger-btn'));

    await waitFor(() => {
      expect(mockAddRebelSuggestion).toHaveBeenCalled();
    });
  });
});
