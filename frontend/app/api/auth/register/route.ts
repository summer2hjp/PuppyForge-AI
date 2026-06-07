import { NextRequest } from 'next/server';
import { jsonResponse, parseBody } from '../_utils';

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://backend:8000';

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  
  // 前端已验证过，这里可做二次检查或直接转发
  if (!body?.email || !body?.password) {
    return jsonResponse({ message: '邮箱和密码不能为空' }, 400);
  }

  try {
    // 直接转发前端构造好的 { email, password, full_name }
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      // FastAPI 通常返回 detail 字段
      return jsonResponse({ message: data.detail || '注册失败' }, res.status);
    }

    return jsonResponse({
      user: data.user,
      token: data.access_token || data.token, // 兼容不同命名
      refreshToken: data.refresh_token || data.refreshToken,
      message: data.message
    }, res.status);
  } catch (error) {
    console.error('[PROXY_REGISTER_ERROR]', error);
    return jsonResponse({ message: '后端服务不可用' }, 503);
  }
}
