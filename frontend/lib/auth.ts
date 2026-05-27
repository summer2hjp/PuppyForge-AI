import bcrypt from 'bcryptjs';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: AuthPayload): Promise<string> {
  const encoded = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() }), 'utf8').toString('base64url');
  return `pf.${encoded}`;
}

export const generateTokens = signToken;

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const [, encoded] = token.split('.');
    if (!encoded) return null;
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<AuthPayload>;
    if (!decoded.userId || !decoded.email || !decoded.role) return null;
    if (!['user', 'moderator', 'admin', 'superadmin'].includes(decoded.role)) return null;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<{ token: string } | null> {
  const payload = await verifyToken(refreshToken);
  if (!payload) return null;
  const token = await signToken(payload);
  return { token };
}

export function parseTokenSafely(token: string): AuthPayload | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<AuthPayload>;
    if (!parsed.userId || !parsed.email || !parsed.role) return null;
    if (!['user', 'moderator', 'admin', 'superadmin'].includes(parsed.role)) return null;
    return parsed as AuthPayload;
  } catch {
    return null;
  }
}
