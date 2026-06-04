import { useAuth } from '@/hooks/useAuth';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { token, refreshSession } = useAuth.getState();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  // 如果返回 401，尝试刷新 Token
  if (response.status === 401) {
    const success = await refreshSession();
    if (success) {
      // 刷新成功后，用新 Token 重试请求
      const newToken = useAuth.getState().token;
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}
