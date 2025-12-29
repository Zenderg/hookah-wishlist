import api from './api';
import type { AuthResponse, User } from '../types';

export const authenticateWithTelegram = async (
  initData: string
): Promise<{ token: string; user: User }> => {
  console.log('[AUTH SERVICE] Starting authentication with Telegram');
  console.log('[AUTH SERVICE] Request payload:', {
    initDataLength: initData.length,
    initDataPreview: initData.substring(0, 100) + '...',
  });

  try {
    const response = await api.post<AuthResponse>('/auth/telegram', {
      initData,
    });

    console.log('[AUTH SERVICE] Received response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    if (!response.data.success) {
      console.error('[AUTH SERVICE] Authentication failed:', {
        errorCode: response.data.error?.code,
        errorMessage: response.data.error?.message,
      });
      throw new Error(response.data.error?.message || 'Authentication failed');
    }

    const { token, user } = response.data.data;

    console.log('[AUTH SERVICE] Authentication successful:', {
      userId: user.id,
      telegramId: user.telegramId,
      username: user.username,
      tokenLength: token.length,
    });

    // Store token in localStorage
    localStorage.setItem('token', token);
    console.log('[AUTH SERVICE] Token stored in localStorage');

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
  console.log('[AUTH SERVICE] Fetching current user');
  const response = await api.get<{ success: boolean; data: User; error: null }>('/users/me');
  console.log('[AUTH SERVICE] Current user fetched:', {
    userId: response.data.data.id,
    telegramId: response.data.data.telegramId,
  });
  return response.data.data;
};

export const logout = () => {
  console.log('[AUTH SERVICE] Logging out');
  localStorage.removeItem('token');
  console.log('[AUTH SERVICE] Token removed from localStorage');
};
