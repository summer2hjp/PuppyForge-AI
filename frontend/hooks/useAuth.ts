import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  is_active: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loginWithOAuth = (provider: 'google' | 'github') => {
    window.location.href = `http://localhost:8000/auth/${provider}/login`;
  };

  const logout = () => {
    localStorage.removeItem('puppy_token');
    setUser(null);
    setToken(null);
  };

  return { user, token, loading, loginWithOAuth, logout };
}
