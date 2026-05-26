import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/auth/refresh/route';
import { refreshAccessToken } from '@/lib/auth';

jest.mock('@/lib/auth');

describe('POST /api/auth/refresh 系统单元测试', () => {
  beforeEach(() => jest.clearAllMocks());

  it('正常刷新Token (Happy Path)', async () => {
    (refreshAccessToken as jest.Mock).mockResolvedValue({ token: 'new-jwt-token' });

    const { req } = createMocks({
      method: 'POST',
      body: { refreshToken: 'valid-refresh-token' }
    });

    const response = await POST(req as Request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.token).toBe('new-jwt-token');
  });

  it('Refresh Token 无效或过期 (401)', async () => {
    (refreshAccessToken as jest.Mock).mockResolvedValue(null);
    const { req } = createMocks({ method: 'POST', body: { refreshToken: 'invalid' } });
    const response = await POST(req as Request);
    expect(response.status).toBe(401);
  });

  it('缺少Refresh Token (400)', async () => {
    const { req } = createMocks({ method: 'POST', body: {} });
    const response = await POST(req as Request);
    expect(response.status).toBe(400);
  });
});
