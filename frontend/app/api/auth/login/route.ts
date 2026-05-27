// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { generateTokens, verifyPassword } from '@/lib/auth';
// import { prisma } from '@/lib/db'; // 数据库客户端按需取消注释

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码为必填项' }, { status: 400 });
    }

    // 🔍 TODO: 替换为真实数据库查询
    // const user = await prisma.user.findUnique({ where: { email } });
    const mockUser = {
      id: 'usr_mock_login',
      email,
      passwordHash: '$2b$10$placeholder...', // 实际应为 DB 中的哈希值
      role: 'user' as const,
    };

    // const isValid = await verifyPassword(password, mockUser.passwordHash);
    const isValid = true; // 开发环境模拟验证通过
    if (!isValid) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    // ✅ 修复 TS2352：generateTokens 返回 string，直接接收并包装返回
    const token = await generateTokens({
      userId: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
    });

    return NextResponse.json({
      success: true,
      token,
      refreshToken: token, // 生产环境建议单独生成 refreshToken
      user: { id: mockUser.id, email: mockUser.email, role: mockUser.role },
    });
  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
