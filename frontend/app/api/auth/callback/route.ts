import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateOAuthUser } from '@/lib/db';
import { signToken, signRefreshToken, type AuthPayload } from '@/lib/auth';

// 注意：真实的 OAuth 流程通常需要后端先拿着 code 去 Provider (Google/GitHub) 换取用户信息。
// 这里模拟已经获取到了用户信息的过程。在实际项目中，你需要在此处调用 Provider 的 API。

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const provider = searchParams.get('provider') || 'github'; // 默认 github
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  const redirectBaseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=oauth_failed&provider=${provider}`, redirectBaseUrl));
  }

  if (!code) {
    // 如果没有 code，可能是直接访问，重定向回登录页
    return NextResponse.redirect(new URL('/auth/login', redirectBaseUrl));
  }

  try {
    // 【重要】在实际生产中，这里需要向后端服务或直接向 OAuth 提供商请求用户信息
    // const userInfo = await fetchUserInfoFromProvider(code, provider);
    
    // 模拟获取到的用户信息 (实际应从 code 交换得到)
    const mockUserInfo = {
      id: `oauth_${provider}_${Date.now()}`,
      email: `user_${Date.now()}@${provider}.com`, // 实际应使用真实邮箱
      name: `${provider} User`,
      avatar: null,
    };

    // 查找或创建用户
    const user = await findOrCreateOAuthUser({
      provider,
      providerId: mockUserInfo.id,
      email: mockUserInfo.email,
      name: mockUserInfo.name,
      avatar: mockUserInfo.avatar,
    });

    if (!user) {
      throw new Error('Failed to create or find user');
    }

    // 生成 Token
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      signToken(payload),
      signRefreshToken(payload)
    ]);

    // 构建回调 URL，将 token 放在 hash 中 (比 query params 更安全，不会被服务器日志记录)
    const callbackUrl = new URL('/auth/callback', redirectBaseUrl);
    callbackUrl.hash = `token=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(user))}`;

    return NextResponse.redirect(callbackUrl);

  } catch (err) {
    console.error('[OAUTH_CALLBACK_ERROR]', err);
    return NextResponse.redirect(new URL(`/auth/login?error=server_error&provider=${provider}`, redirectBaseUrl));
  }
}
