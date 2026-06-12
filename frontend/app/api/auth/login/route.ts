import type { NextRequest } from 'next/server';
import { generateTokens } from '@/lib/auth';
import { verifyUserPassword } from '@/lib/db';
import { jsonResponse, parseBody } from '../_utils';

export async function POST(request: NextRequest) {
  const body = await parseBody(request);

  if (!body?.email || !body?.password) {
   return jsonResponse({ message: '邮箱和密码不能为空' }, 400);
  }

  try {
   const user = await verifyUserPassword(body.email, body.password);
   if (!user) {
     return jsonResponse({ message: '邮箱或密码错误' }, 401);
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
   });
  } catch (error) {
   console.error('[LOGIN_ERROR]', error);
   return jsonResponse({ message: '登录失败' }, 500);
  }
}
