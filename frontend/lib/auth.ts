import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'crypto';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
}

type TokenType = 'access' | 'refresh';

type SignedPayload = AuthPayload & {
  typ: TokenType;
  exp: number;
};

const TOKEN_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-do-not-use-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return signTypedToken(payload, 'access', 24 * 60 * 60 * 1000);
}

export async function signRefreshToken(payload: AuthPayload): Promise<string> {
  return signTypedToken(payload, 'refresh', 7 * 24 * 60 * 60 * 1000);
}

export const generateTokens = signToken;

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  const decoded = decodeAndVerify(token);
  if (!decoded) return null;

  const { userId, email, role, exp } = decoded;
  if (Date.now() > exp) return null;
  if (!['user', 'moderator', 'admin', 'superadmin'].includes(role)) return null;

  return { userId, email, role };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ token: string } | null> {
  const decoded = decodeAndVerify(refreshToken);
  if (!decoded) return null;
  if (Date.now() > decoded.exp) return null;
  if (decoded.typ !== 'refresh') return null;

  const token = await signToken({
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  });
  return { token };
}

export function parseTokenSafely(token: string): AuthPayload | null {
  const decoded = decodeAndVerify(token);
  if (!decoded) return null;
  if (Date.now() > decoded.exp) return null;
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };
}

async function signTypedToken(payload: AuthPayload, typ: TokenType, ttlMs: number): Promise<string> {
  const signedPayload: SignedPayload = {
    ...payload,
    typ,
    exp: Date.now() + ttlMs,
  };
  const encodedPayload = Buffer.from(JSON.stringify(signedPayload), 'utf8').toString('base64url');
  const signature = createSignature(encodedPayload);
  return `pf.${encodedPayload}.${signature}`;
}

function decodeAndVerify(token: string): SignedPayload | null {
  const [prefix, encodedPayload, signature] = token.split('.');
  if (prefix !== 'pf' || !encodedPayload || !signature) return null;

  const expected = createSignature(encodedPayload);
  const actualBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SignedPayload;
    if (!decoded.userId || !decoded.email || !decoded.role || !decoded.typ || !decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function createSignature(encodedPayload: string): string {
  return createHmac('sha256', TOKEN_SECRET).update(encodedPayload).digest('hex');
}
