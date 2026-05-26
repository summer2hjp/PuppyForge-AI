import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/auth/login/route';
import { verifyUserPassword } from '@/lib/db';
import { generateTokens } from '@/lib/auth';

jest.mock('@/lib/db');
jest.mock('@/lib/auth');

describe('POST /api/auth/login 系统单元测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== 正常场景 ====================
  it('正常登录 - 成功返回 user + tokens (Happy Path)', async () => {
    // Arrange
    const mockUser = {
      id: 'user-123',
      email: 'test@puppyforge.ai',
      role: 'user',
    };

    (verifyUserPassword as jest.Mock).mockResolvedValue(mockUser);
    (generateTokens as jest.Mock).mockResolvedValue({
      token: 'jwt-token-xxx',
      refreshToken: 'refresh-token-yyy',
    });

    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'test@puppyforge.ai',
        password: 'correctpassword123',
      },
    });

    // Act
    const response = await POST(req as Request);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({
      user: mockUser,
      token: 'jwt-token-xxx',
      refreshToken: 'refresh-token-yyy',
    });
    expect(verifyUserPassword).toHaveBeenCalledWith('test@puppyforge.ai', 'correctpassword123');
  });

  // ==================== 边界 & 验证失败 ====================
  it('输入验证失败 - 邮箱或密码为空 (400)', async () => {
    const testCases = [
      { email: '', password: '123456' },
      { email: 'test@puppyforge.ai', password: '' },
      { email: null, password: '123456' },
      { email: 'test@puppyforge.ai', password: null },
    ];

    for (const body of testCases) {
      const { req } = createMocks({ method: 'POST', body });
      const response = await POST(req as Request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe('邮箱和密码不能为空');
    }
  });

  it('请求体格式错误 - 非对象或解析失败 (400)', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: 'invalid json string',
    });

    const response = await POST(req as Request);
    expect(response.status).toBe(400);
  });

  // ==================== 认证失败 ====================
  it('用户不存在或密码错误 (401)', async () => {
    (verifyUserPassword as jest.Mock).mockResolvedValue(null);

    const { req } = createMocks({
      method: 'POST',
      body: { email: 'wrong@puppyforge.ai', password: 'wrongpass' },
    });

    const response = await POST(req as Request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.message).toBe('邮箱或密码错误');
  });

  // ==================== 异常处理 ====================
  it('服务器内部异常 - 返回500', async () => {
    (verifyUserPassword as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    const { req } = createMocks({
      method: 'POST',
      body: { email: 'test@puppyforge.ai', password: 'password' },
    });

    const response = await POST(req as Request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.message).toBe('登录失败');
  });

  // ==================== 类型安全 ====================
  it('应正确处理 Request 类型', async () => {
    const { req } = createMocks({ method: 'POST', body: { email: 'a@b.com', password: 'p' } });
    expect(typeof POST).toBe('function');
    const response = await POST(req as Request);
    expect(response).toBeInstanceOf(Response);
  });
});
