export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}