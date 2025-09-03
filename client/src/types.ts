// User types
export interface User {
  id: string;
  phone: string;
  username: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Auth types
export interface LoginCredentials {
  phone: string;
  password: string;
  role: string;
}

export interface RegisterData {
  phone: string;
  password: string;
  username: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}