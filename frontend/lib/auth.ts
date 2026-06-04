import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

// ================= 类型定义 =================

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
  createdAt: string;
}

type TokenType = 'access' | 'refresh';

interface SignedPayload extends AuthPayload {
  typ: TokenType;
  exp: number; // 过期时间戳 (ms)
  iat: number; // 签发时间戳 (ms)
}

// ================= 配置与安全 =================

const TOKEN_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!TOKEN_SECRET && NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// 开发环境 fallback，生产环境严禁使用
const FALLBACK_SECRET = 'dev-fallback-secret-change-me-in-production';
const SECRET = TOKEN_SECRET || FALLBACK_SECRET;

// 令牌有效期配置
const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 小时
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

// ================= 密码工具 =================

/**
 * 哈希密码
 * @param password 明文密码
 * @returns 哈希后的密码字符串
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // 生产环境建议 12 或更高
  return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 * @param password 明文密码
 * @param hash 哈希密码
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || hash.length < 10) return false;
  return bcrypt.compare(password, hash);
}

// ================= 令牌核心逻辑 =================

/**
 * 生成 Access Token
 */
export async function signToken(payload: AuthPayload): Promise<string> {
  return signTypedToken(payload, 'access', ACCESS_TOKEN_TTL_MS);
}

/**
 * 生成 Refresh Token
 */
export async function signRefreshToken(payload: AuthPayload): Promise<string> {
  return signTypedToken(payload, 'refresh', REFRESH_TOKEN_TTL_MS);
}

/**
 * 生成双令牌对象 (便捷方法)
 */
export async function generateTokens(payload: AuthPayload): Promise<{
  token: string;
  refreshToken: string;
}> {
  const [token, refreshToken] = await Promise.all([
    signToken(payload),
    signRefreshToken(payload)
  ]);
  return { token, refreshToken };
}

/**
 * 验证并解码 Token
 * @param token JWT 字符串
 * @returns 解析后的 Payload 或 null (无效/过期)
 */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  const decoded = decodeAndVerify(token);
  if (!decoded) return null;

  // 检查过期时间
  if (Date.now() > decoded.exp) {
    return null;
  }

  // 检查角色合法性
  const validRoles = ['user', 'moderator', 'admin', 'superadmin'];
  if (!validRoles.includes(decoded.role)) {
    return null;
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };
}

/**
 * 仅解析 Payload 不检查过期 (用于调试或特殊场景)
 */
export function parseTokenSafely(token: string): AuthPayload | null {
  const decoded = decodeAndVerify(token);
  if (!decoded) return null;
  
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };
}

// ================= 内部辅助函数 =================

/**
 * 签署带类型的 Token
 * 格式: pf.<base64url-payload>.<hex-signature>
 */
async function signTypedToken(
  payload: AuthPayload, 
  typ: TokenType, 
  ttlMs: number
): Promise<string> {
  const now = Date.now();
  const signedPayload: SignedPayload = {
    ...payload,
    typ,
    exp: now + ttlMs,
    iat: now,
  };

  // 1. 编码 Payload (Base64URL)
  const jsonPayload = JSON.stringify(signedPayload);
  const encodedPayload = Buffer.from(jsonPayload, 'utf8').toString('base64url');

  // 2. 生成签名 (HMAC-SHA256)
  const signature = createSignature(encodedPayload);

  // 3. 组装 Token
  return `pf.${encodedPayload}.${signature}`;
}

/**
 * 解码并验证签名
 */
function decodeAndVerify(token: string): SignedPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [prefix, encodedPayload, signature] = parts;

  // 验证前缀
  if (prefix !== 'pf') return null;

  // 验证签名 (防篡改)
  const expectedSignature = createSignature(encodedPayload);
  
  // 使用 constant-time 比较防止时序攻击
  try {
    const sigBuffer = Buffer.from(signature, 'hex');
    const expBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (sigBuffer.length !== expBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expBuffer)) return null;
  } catch (e) {
    return null;
  }

  // 解码 Payload
  try {
    const jsonStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const decoded = JSON.parse(jsonStr) as SignedPayload;

    // 校验必要字段
    if (
      !decoded.userId || 
      !decoded.email || 
      !decoded.role || 
      !decoded.typ || 
      !decoded.exp ||
      !decoded.iat
    ) {
      return null;
    }

    return decoded;
  } catch (e) {
    return null;
  }
}

/**
 * 创建 HMAC-SHA256 签名
 */
function createSignature(data: string): string {
  return createHmac('sha256', SECRET)
    .update(data, 'utf8')
    .digest('hex');
}

/**
 * 生成随机字符串 (用于 State 参数或临时 ID)
 */
export function generateRandomString(length: number = 32): string {
  return randomBytes(length).toString('hex');
}
