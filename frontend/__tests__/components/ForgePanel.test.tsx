import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgePanel from '@/components/ForgePanel';

describe('ForgePanel', () => {
  it('renders simulation notice badge', () => {
    render(<ForgePanel />);
    expect(screen.getByText(/客户端模拟/)).toBeInTheDocument();
  });

  it('renders prompt input area', () => {
    render(<ForgePanel />);
    expect(screen.getByText('锻造提示词')).toBeInTheDocument();
    expect(screen.getByTestId('forge-prompt-input')).toBeInTheDocument();
  });

  it('renders the start forging button', () => {
    render(<ForgePanel />);
    expect(screen.getByText('开始锻造')).toBeInTheDocument();
  });

  it('disables button when prompt is empty', () => {
    render(<ForgePanel />);
    expect(screen.getByTestId('forge-start-btn')).toBeDisabled();
  });

  it('enables button when prompt has text', async () => {
    const user = userEvent.setup();
    render(<ForgePanel />);

    const input = screen.getByTestId('forge-prompt-input');
    await user.type(input, '生成一个冒险故事');

    expect(screen.getByTestId('forge-start-btn')).toBeEnabled();
  });

  it('shows forging progress after start', async () => {
    const user = userEvent.setup();
    render(<ForgePanel />);

    const input = screen.getByTestId('forge-prompt-input');
    await user.type(input, '勇敢的小狗');
    await user.click(screen.getByTestId('forge-start-btn'));

    expect(await screen.findByText('四阶段炼金锻造中...')).toBeInTheDocument();
  });

  it('displays forge result after completion', async () => {
    const user = userEvent.setup();
    render(<ForgePanel />);

    const input = screen.getByTestId('forge-prompt-input');
    await user.type(input, '勇敢的小狗冒险');
    await user.click(screen.getByTestId('forge-start-btn'));

    await waitFor(() => {
      expect(screen.getByText('锻造完成')).toBeInTheDocument();
      expect(screen.getByText('Prompt 炼金')).toBeInTheDocument();
      expect(screen.getByText('并行锻造')).toBeInTheDocument();
      expect(screen.getByText('对抗质检')).toBeInTheDocument();
      expect(screen.getByText('资产结晶')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows final quality score', async () => {
    const user = userEvent.setup();
    render(<ForgePanel />);

    const input = screen.getByTestId('forge-prompt-input');
    await user.type(input, '测试锻造');
    await user.click(screen.getByTestId('forge-start-btn'));

    await waitFor(() => {
      const scoreBtns = screen.getAllByText(/分/);
      expect(scoreBtns.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('shows reset button after completion', async () => {
    const user = userEvent.setup();
    render(<ForgePanel />);

    const input = screen.getByTestId('forge-prompt-input');
    await user.type(input, '测试');
    await user.click(screen.getByTestId('forge-start-btn'));

    await waitFor(() => {
      expect(screen.getByText('重新锻造')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('resets to initial state when reset is clicked', async () => {
    const user = userEvent.setup();
    render(<ForgePanel />);

    const input = screen.getByTestId('forge-prompt-input');
    await user.type(input, '测试');
    await user.click(screen.getByTestId('forge-start-btn'));

    await waitFor(async () => {
      const btn = screen.getByText('重新锻造');
      await user.click(btn);
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('锻造提示词')).toBeInTheDocument();
    });
  });
});
