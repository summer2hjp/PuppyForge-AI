import type { User } from '@/types/auth';
import { hashPassword } from './auth';

// ⚠️ 内存 Mock 存储：生产环境请替换为数据库查询
const userStore = new Map<string, { passwordHash: string } & User>();

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
