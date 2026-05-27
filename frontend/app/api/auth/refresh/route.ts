import { refreshAccessToken } from '@/lib/auth';

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

    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : '';
    if (!refreshToken) {
      return jsonResponse({ message: '缺少 refresh token' }, 400);
    }

    const result = await refreshAccessToken(refreshToken);
    if (!result) {
      return jsonResponse({ message: 'Refresh token 无效或已过期' }, 401);
    }

    return jsonResponse(result, 200);
  } catch (error) {
    console.error('[REFRESH_ERROR]', error);
    return jsonResponse({ message: '刷新失败' }, 500);
  }
}
