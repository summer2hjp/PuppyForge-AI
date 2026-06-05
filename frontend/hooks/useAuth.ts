'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string | number;
  email: string;
  full_name?: string | null;
  name?: string | null;
  avatar?: string | null;
  role?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  // 修改：增加 fullName 参数
  register: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  logout: () => Promise<void>;
  
  setUser: (user: User | null) => void;
  clearError: () => void;
  refreshSession: () => Promise<boolean>;
}

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin; 
  }
  return '';
};

const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    // 确保 .env.local 中定义了 NEXT_PUBLIC_BACKEND_URL=http://192.168.3.160:8000
    return process.env.NEXT_PUBLIC_BACKEND_URL || window.location.origin;
  }
  return '';
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,

      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || data.message || 'Login failed');

          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            error: null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Network error';
          set({ error: message });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      // 修改：接收 fullName 并构造正确的请求体
      register: async (email: string, password: string, fullName: string) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // 【关键】映射为后端期望的 full_name
            body: JSON.stringify({ 
              email, 
              password, 
              full_name: fullName 
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || data.message || 'Registration failed');

          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            error: null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Network error';
          set({ error: message });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      loginWithOAuth: async (provider: 'google' | 'github') => {
        console.log(`[DEBUG useAuth] 开始 OAuth 登录流程，Provider: ${provider}`); 
        if (typeof window === 'undefined') {
          console.warn('[DEBUG useAuth] 服务端渲染环境，跳过跳转');
          return;
        }
        
        const backendUrl = getBackendUrl();
        const oauthUrl = `${backendUrl}/api/v1/auth/${provider}/login`;
        
        console.log(`[DEBUG useAuth] 即将跳转 URL: ${oauthUrl}`);
        console.log(`[DEBUG useAuth] 当前 Backend URL 配置: ${backendUrl}`);

        try {
          // 执行跳转
          window.location.href = oauthUrl;
        } catch (error) {
          console.error('[DEBUG useAuth] 跳转失败:', error);
          set({ error: 'OAuth 跳转失败，请检查控制台日志' });
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          const { token } = get();
          if (token) {
            await fetch(`${getApiBase()}/api/auth/logout`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
          }
        } finally {
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

      setUser: (user: User | null) => set({ user }),

      refreshSession: async (): Promise<boolean> => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        set({ loading: true });
        try {
          const res = await fetch(`${getApiBase()}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || 'Session expired');

          set({
            token: data.token,
            refreshToken: data.refreshToken,
            user: data.user,
            error: null,
          });
          return true;
        } catch (error) {
          get().logout();
          return false;
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'puppy-forge-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
