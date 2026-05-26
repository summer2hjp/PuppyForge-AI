import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/auth/register/route';
import { createUser, verifyUserPassword } from '@/lib/db';
import { generateTokens } from '@/lib/auth';

jest.mock('@/lib/db');
jest.mock('@/lib/auth');

describe('POST /api/auth/register 系统单元测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== 正常场景 ====================
  it('正常注册 - 成功创建用户并返回tokens (Happy Path)', async () => {
    // Arrange
    const mockUser = {
      id: 'user-new-456',
      email: 'newuser@puppyforge.ai',
      role: 'user',
    };

    (createUser as jest.Mock).mockResolvedValue(mockUser);
    (generateTokens as jest.Mock).mockResolvedValue({
      token: 'jwt-token-new-xxx',
      refreshToken: 'refresh-token-new-yyy',
    });

    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'newuser@puppyforge.ai',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      },
    });

    // Act
    const response = await POST(req as Request);

    // Assert
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toEqual({
      user: mockUser,
      token: 'jwt-token-new-xxx',
      refreshToken: 'refresh-token-new-yyy',
      message: '注册成功',
    });
    expect(createUser).toHaveBeenCalledWith(
      'newuser@puppyforge.ai',
      'SecurePass123!'
    );
  });

  // ==================== 验证失败场景 ====================
  it('输入验证失败 - 字段缺失或密码不匹配 (400)', async () => {
    const testCases = [
      { email: '', password: '123456', confirmPassword: '123456' },           // 空邮箱
      { email: 'test@puppyforge.ai', password: '', confirmPassword: '' },    // 空密码
      { email: 'test@puppyforge.ai', password: '123', confirmPassword: '456' }, // 密码不匹配
      { email: 'invalid-email', password: '123456', confirmPassword: '123456' }, // 无效邮箱
    ];

    for (const body of testCases) {
      const { req } = createMocks({ method: 'POST', body });
      const response = await POST(req as Request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toMatch(/邮箱|密码|匹配/);
    }
  });

  // ==================== 业务规则失败 ====================
  it('邮箱已存在 - 返回409冲突', async () => {
    (createUser as jest.Mock).mockResolvedValue(null); // 模拟已存在

    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'existing@puppyforge.ai',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      },
    });

    const response = await POST(req as Request);
    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.message).toBe('该邮箱已被注册');
  });

  // ==================== 异常处理 ====================
  it('服务器内部异常 - 返回500', async () => {
    (createUser as jest.Mock).mockRejectedValue(new Error('Database error during registration'));

    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'error@puppyforge.ai',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      },
    });

    const response = await POST(req as Request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.message).toBe('注册失败');
  });

  // ==================== 类型与边界安全 ====================
  it('应正确处理 Request 类型和无效JSON', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: 'invalid json string',
    });

    const response = await POST(req as Request);
    expect(response.status).toBe(400);
  });

  it('应正确处理函数类型', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: { email: 'a@b.com', password: 'p', confirmPassword: 'p' },
    });
    expect(typeof POST).toBe('function');
    const response = await POST(req as Request);
    expect(response).toBeInstanceOf(Response);
  });
});
