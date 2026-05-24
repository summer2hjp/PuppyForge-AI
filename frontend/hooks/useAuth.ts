import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    isAuthenticated: false,
  });

  // 初始化 + 持久化
  useEffect(() => {
    const savedToken = localStorage.getItem('puppy_token');
    if (savedToken) {
      validateToken(savedToken);
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const res = await fetch('http://localhost:8000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const user = await res.json();
        setAuthState({
          user,
          token,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        localStorage.removeItem('puppy_token');
        setAuthState({
          user: null,
          token: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error("Token validation failed:", error);
      localStorage.removeItem('puppy_token');
      setAuthState({
        user: null,
        token: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('puppy_token', data.access_token);
        
        await validateToken(data.access_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      return res.ok;
    } catch (error) {
      console.error("Register failed:", error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('puppy_token');
    setAuthState({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
    });
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
  };
}
