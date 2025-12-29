import api from './api';
import type { AuthResponse, User } from '../types';

export const authenticateWithTelegram = async (
  initData: string
): Promise<{ token: string; user: User }> => {
  try {
    const response = await api.post<AuthResponse>('/auth/telegram', {
      initData,
    });

    if (!response.data.success) {
      console.error('[AUTH SERVICE] Authentication failed:', {
        errorCode: response.data.error?.code,
        errorMessage: response.data.error?.message,
      });
      throw new Error(response.data.error?.message || 'Authentication failed');
    }

    const { token, user } = response.data.data;

    // Store token in localStorage
    localStorage.setItem('token', token);

    return { token, user };
  } catch (error) {
    console.error('[AUTH SERVICE] Request failed:', error);
    if (error instanceof Error) {
      console.error('[AUTH SERVICE] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<{ success: boolean; data: User; error: null }>('/users/me');
  return response.data.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

/**
 * Refresh JWT token
 */
export const refreshToken = async (): Promise<string> => {
  const currentToken = localStorage.getItem('token');
  if (!currentToken) {
    throw new Error('No token to refresh');
  }

  try {
    const response = await api.post<{ success: boolean; data: { token: string }; error: null }>('/auth/refresh', {
      token: currentToken,
    });

    if (!response.data.success) {
      throw new Error('Token refresh failed');
    }

    const newToken = response.data.data.token;
    localStorage.setItem('token', newToken);
    return newToken;
  } catch (error) {
    console.error('[AUTH SERVICE] Token refresh failed:', error);
    throw error;
  }
};
