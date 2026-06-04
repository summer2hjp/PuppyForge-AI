import { NextRequest } from 'next/server';
import { jsonResponse, parseBody } from './_utils';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://192.168.3.160:8000';

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return jsonResponse({ message: data.detail || 'Login failed' }, res.status);
    }

    // 后端返回格式可能略有不同，需适配
    return jsonResponse({
      user: data.user,
      token: data.token, // 确保字段名与 useAuth 一致
      refreshToken: data.refreshToken
    });
  } catch (error) {
    console.error('[PROXY_LOGIN_ERROR]', error);
    return jsonResponse({ message: 'Backend service unavailable' }, 503);
  }
}
