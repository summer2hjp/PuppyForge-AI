'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 🔐 用户类型定义
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: 'user' | 'admin' | 'moderator';
  createdAt?: string;
}

// 📦 认证状态接口（对齐 TS 严格模式）
export interface AuthState {
  // 状态字段
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;

  // 核心操作
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  logout: () => Promise<void>;
  
  // 辅助操作
  setUser: (user: User | null) => void;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

// 🌐 动态 API 基础路径（兼容 SSR/CSR）
const getApiBase = () =>
  typeof window !== 'undefined' ? window.location.origin : '';

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,

      // 清除错误状态
      clearError: () => set({ error: null }),

      // 🔑 邮箱密码登录
      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({ message: '登录失败' }));
            throw new Error(errData.message || `HTTP ${res.status}`);
          }

          const data = await res.json();
          set({
            user: data.user as User,
            token: data.token as string,
            refreshToken: data.refreshToken as string | undefined,
            error: null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : '网络连接异常';
          set({ error: message });
          throw err; // 抛出供 UI 层捕获显示
        } finally {
          set({ loading: false });
        }
      },

      // 📝 注册
      register: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({ message: '注册失败' }));
            throw new Error(errData.message || `HTTP ${res.status}`);
          }

          const data = await res.json();
          set({
            user: data.user as User,
            token: data.token as string,
            refreshToken: data.refreshToken as string | undefined,
            error: null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : '网络连接异常';
          set({ error: message });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      // 🌐 OAuth 登录（通常重定向至后端授权流）
      loginWithOAuth: async (provider: 'google' | 'github') => {
        set({ loading: true, error: null });
        try {
          if (typeof window !== 'undefined') {
            // 实际项目中应跳转至 /api/auth/${provider}
            window.location.href = `${getApiBase()}/api/auth/${provider}`;
          }
        } catch (err) {
          set({ error: 'OAuth 跳转失败', loading: false });
          throw err;
        }
      },

      // 🚪 登出
      logout: async () => {
        set({ loading: true });
        try {
          const { token } = get();
          if (token) {
            await fetch(`${getApiBase()}/api/auth/logout`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {}); // 忽略网络错误，强制清理本地状态
          }
        } finally {
          // 使用 Zustand 内置方法清理持久化存储
          useAuth.persist.clearStorage();
          set({
            user: null,
            token: null,
            refreshToken: null,
            loading: false,
            error: null,
          });
        }
      },

      // 🧩 直接设置用户（用于 OAuth 回调或 SSR 水合）
      setUser: (user: User | null) => set({ user }),

      // 🔄 刷新会话（验证 Token 有效性）
      refreshSession: async () => {
        const { token, refreshToken } = get();
        if (!token) return;

        set({ loading: true });
        try {
          const res = await fetch(`${getApiBase()}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!res.ok) throw new Error('Session expired');

          const data = await res.json();
          set({
            token: data.token as string,
            refreshToken: data.refreshToken as string | undefined,
            user: data.user as User,
            error: null,
          });
        } catch {
          // Token 失效，自动执行登出
          get().logout();
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'puppy-forge-auth-storage', // localStorage 键名
      // ⚡ 仅持久化关键数据，不存储 loading/error 等瞬态字段
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      // 🔄 应用恢复时自动尝试验证会话
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.refreshSession().catch(() => {});
        }
      },
    }
  )
);
