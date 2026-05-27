// ========================================
// 认证工具库 - JWT & 密码哈希
// ========================================
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-dev-secret-do-not-use-in-production'
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: AuthPayload): Promise<string> {
  // ✅ 修复 TS2352：展开 payload 满足 jose 的 Record<string, unknown> 要求
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

// ✅ 新增：兼容 API 路由的导出别名
export const generateTokens = signToken;

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      ['user', 'moderator', 'admin', 'superadmin'].includes(payload.role as string)
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as AuthPayload['role'],
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function parseTokenSafely(token: string): AuthPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      ['user', 'moderator', 'admin', 'superadmin'].includes(payload.role)
    ) {
      return payload as AuthPayload;
    }
    return null;
  } catch {
    return null;
  }
}
