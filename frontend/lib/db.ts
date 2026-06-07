import type { User } from '@/type/auth';
import { hashPassword, verifyPassword } from './auth';

// ⚠️ 内存 Mock 存储：生产环境请替换为数据库查询
type UserRecord = { passwordHash: string } & User;
type UserStoreGlobal = typeof globalThis & { __puppyforgeUserStore?: Map<string, UserRecord> };
const userStoreGlobal = globalThis as UserStoreGlobal;
const userStore = userStoreGlobal.__puppyforgeUserStore ?? new Map<string, UserRecord>();

if (!userStoreGlobal.__puppyforgeUserStore) {
  userStoreGlobal.__puppyforgeUserStore = userStore;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  for (const [, userData] of userStore) {
    if (userData.email === email.toLowerCase()) {
      const { passwordHash, ...user } = userData;
      return user;
    }
  }
  return null;
}

export async function createUser(email: string, password: string): Promise<User> {
  const hash = await hashPassword(password);
  const user: User = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    name: email.split('@')[0],
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  userStore.set(user.id, { ...user, passwordHash: hash });
  return user;
}

// 🔍 用于登录验证的密码检查
export async function verifyUserPassword(email: string, password: string): Promise<User | null> {
  const userData = userStore.get(
    Array.from(userStore.values()).find(u => u.email === email.toLowerCase())?.id || ''
  );
  if (!userData) return null;

  const isMatch = await verifyPassword(password, userData.passwordHash);
  if (!isMatch) return null;

  const { passwordHash, ...user } = userData;
  return user;
}

export interface OAuthUserInput {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  avatar: string | null;
}

export async function findOrCreateOAuthUser(input: OAuthUserInput): Promise<User> {
  // Check if a user with this provider ID already exists
  for (const [, userData] of userStore) {
    if (userData.email === input.email.toLowerCase()) {
      const { passwordHash, ...user } = userData;
      return user;
    }
  }

  // Create new user
  const user: User = {
    id: `oauth_${input.provider}_${Date.now()}`,
    email: input.email.toLowerCase(),
    name: input.name,
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  userStore.set(user.id, { ...user, passwordHash: '' });
  return user;
}
