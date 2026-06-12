import type { NextRequest } from 'next/server';
import { createUser } from '@/lib/db';
import { generateTokens } from '@/lib/auth';
import { jsonResponse, parseBody } from '../_utils';

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  if (!body?.email || !body?.password || body.password !== body.confirmPassword) {
    return jsonResponse({ message: '邮箱和密码不能为空' }, 400);
  }

  try {
    const user = await createUser(body.email, body.password);
    if (!user) {
      return jsonResponse({ message: '该邮箱已被注册' }, 409);
    }

    const tokens = await generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return jsonResponse({
      user,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      message: '注册成功',
    }, 201);
  } catch (error) {
    console.error('[REGISTER_ERROR]', error);
    return jsonResponse({ message: '注册失败' }, 500);
  }
}
