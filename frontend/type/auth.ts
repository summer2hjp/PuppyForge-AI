export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: 'user' | 'admin' | 'moderator';
  createdAt?: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
