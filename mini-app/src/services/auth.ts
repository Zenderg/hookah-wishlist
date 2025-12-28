import api from './api';
import type { AuthResponse, User } from '../types';

export const authenticateWithTelegram = async (
  initData: string
): Promise<{ token: string; user: User }> => {
  const response = await api.post<AuthResponse>('/auth/telegram', {
    initData,
  });

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Authentication failed');
  }

  const { token, user } = response.data.data;

  // Store token in localStorage
  localStorage.setItem('token', token);

  return { token, user };
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<{ success: boolean; data: User; error: null }>('/users/me');
  return response.data.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};
