import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/contexts/AuthContext';
import DiagnosisPage from '@/app/diagnosis/page';

describe('Auth + Diagnosis 集成测试', () => {
  it('登录后完整执行AI诊断流程', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <DiagnosisPage />
      </AuthProvider>
    );

    // 模拟已登录状态
    await waitFor(() => {
      expect(screen.getByText(/欢迎/)).toBeInTheDocument();
    });

    const file = new File(['dummy'], 'puppy.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('image-upload');
    
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: /开始诊断/ }));

    await waitFor(() => {
      expect(screen.getByText(/诊断完成/)).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});
