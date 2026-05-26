import { NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/db';
import { generateTokens } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const email = typeof body === 'object' && body !== null && 'email' in body ? body.email : undefined;
    const password =
      typeof body === 'object' && body !== null && 'password' in body ? body.password : undefined;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ message: '邮箱和密码不能为空' }, { status: 400 });
    }

    const exists = await findUserByEmail(email);
    if (exists) {
      return NextResponse.json({ message: '该邮箱已注册' }, { status: 409 });
    }

    const user = await createUser(email, password);
    const tokens = (await generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role ?? 'user',
    })) as { token: string; refreshToken: string };

    return NextResponse.json({ user, token: tokens.token, refreshToken: tokens.refreshToken }, { status: 201 });
  } catch {
    return NextResponse.json({ message: '注册失败' }, { status: 500 });
  }
}
