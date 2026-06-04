export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
  provider?: string;
  providerId?: string | null;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: User['role'];
}

export interface TokenPair {
  token: string;
  refreshToken: string;
}
