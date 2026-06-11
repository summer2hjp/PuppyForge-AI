import { NextRequest } from 'next/server';
import { jsonResponse } from '../../auth/_utils';

// 后端地址优先级: 1)Docker内部 2)构建时公网地址 3)本地
const BACKEND_URL =
  process.env.INTERNAL_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:8000';

/**
 * 代理 GitHub OAuth 回调 — 用于前端页面直接收到 ?code=xxx 的场景
 * GitHub 回调 → 前端 → 此 API → 后端 callback → 返回 token
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state') || '';

  if (!code) {
    return jsonResponse({ message: 'Missing code parameter' }, 400);
  }

  try {
    // 将 code 转发给真正的后端 callback
    const res = await fetch(
      `${BACKEND_URL}/api/v1/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      { method: 'GET', redirect: 'manual' }
    );

    // 后端 callback 返回 307 redirect 到前端页面 #token=...
    if (res.status === 307 || res.status === 302) {
      const location = res.headers.get('location');
      if (!location) {
        return jsonResponse({ message: 'No redirect from backend' }, 502);
      }

      // 从 redirect URL 的 hash 中提取 token/user
      const hashIndex = location.indexOf('#');
      if (hashIndex === -1) {
        try {
          const url = new URL(location);
          const error = url.searchParams.get('error');
          return jsonResponse({ message: error || 'OAuth failed' }, 400);
        } catch {
          return jsonResponse({ message: 'Invalid redirect URL' }, 502);
        }
      }

      const hash = location.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);
      const token = params.get('token');
      const refreshToken = params.get('refreshToken');
      const userStr = params.get('user');

      if (!token || !userStr) {
        return jsonResponse({ message: 'Missing token in callback' }, 502);
      }

      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        return jsonResponse({ token, refreshToken, user });
      } catch {
        return jsonResponse({ message: 'Invalid user data in callback' }, 502);
      }
    }

    // 非 redirect 响应 — 可能是错误
    const data = await res.json().catch(() => ({}));
    return jsonResponse(
      { message: data.detail || data.message || 'Backend callback failed' },
      res.status
    );
  } catch (error) {
    console.error('[GITHUB_CALLBACK_PROXY]', error);
    return jsonResponse({ message: 'Backend service unavailable' }, 503);
  }
}
