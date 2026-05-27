// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { generateTokens, hashPassword } from '@/lib/auth';
// import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码为必填项' }, { status: 400 });
    }

    // 🔍 TODO: 检查用户是否已存在
    // const existingUser = await prisma.user.findUnique({ where: { email } });
    const existingUser = null; // 开发环境模拟未注册
    if (existingUser) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 });
    }

    // 🔐 TODO: 哈希密码并创建用户
    // const hashedPassword = await hashPassword(password);
    // const user = await prisma.user.create({
    //   data: { email, password: hashedPassword, name: name || email.split('@')[0] },
    // });
    const mockUser = {
      id: `usr_reg_${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      role: 'user' as const,
    };

    // ✅ 修复 TS2352：正确接收 JWT 字符串，不做非法类型断言
    const token = await generateTokens({
      userId: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
    });

    return NextResponse.json({
      success: true,
      token,
      refreshToken: token,
      user: { id: mockUser.id, email: mockUser.email, name: mockUser.name },
    }, { status: 201 });
  } catch (error) {
    console.error('[REGISTER_ERROR]', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
