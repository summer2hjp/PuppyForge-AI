// app/api/auth/login/route.ts
import { generateTokens, signRefreshToken } from '@/lib/auth';
import { verifyUserPassword } from '@/lib/db';

async function readRequestBody(request: Request): Promise<Record<string, unknown> | null> {
  const maybeRequest = request as {
    json?: () => Promise<unknown>;
    body?: unknown;
  };
  if (typeof maybeRequest.json === 'function') {
    try {
      const body = await maybeRequest.json();
      return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  const body = maybeRequest.body;
  if (body && typeof body === 'object' && !('getReader' in (body as Record<string, unknown>))) {
    return body as Record<string, unknown>;
  }
  return null;
}

function jsonResponse(payload: unknown, status = 200): Response {
  if (typeof Response === 'undefined') {
    return { status, json: async () => payload } as unknown as Response;
  }
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request);
    if (!body) {
      return jsonResponse({ message: '请求体格式错误' }, 400);
    }

    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return jsonResponse({ message: '邮箱和密码不能为空' }, 400);
    }

    const user = await verifyUserPassword(email, password);
    if (!user) {
      return jsonResponse({ message: '邮箱或密码错误' }, 401);
    }

    const generated = await generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role ?? 'user',
    });

    const tokenPayload =
      typeof generated === 'string'
        ? { token: generated, refreshToken: await signRefreshToken({ userId: user.id, email: user.email, role: user.role ?? 'user' }) }
        : generated;

    return jsonResponse({
      user,
      token: tokenPayload.token,
      refreshToken: tokenPayload.refreshToken,
    });
  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    return jsonResponse({ message: '登录失败' }, 500);
  }
}
