import { NextResponse } from 'next/server';
import { generateTokens } from '@/lib/auth';
import { verifyUserPassword } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const email = typeof body === 'object' && body !== null && 'email' in body ? body.email : undefined;
    const password =
      typeof body === 'object' && body !== null && 'password' in body ? body.password : undefined;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ message: '邮箱和密码不能为空' }, { status: 400 });
    }

    const user = await verifyUserPassword(email, password);
    if (!user) {
      return NextResponse.json({ message: '邮箱或密码错误' }, { status: 401 });
    }

    const tokens = (await generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role ?? 'user',
    })) as { token: string; refreshToken: string };

    return NextResponse.json({ user, token: tokens.token, refreshToken: tokens.refreshToken }, { status: 200 });
  } catch {
    return NextResponse.json({ message: '登录失败' }, { status: 500 });
  }
}
