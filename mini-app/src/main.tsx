import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { init, retrieveRawInitData } from '@telegram-apps/sdk';
import { useAuthStore } from './stores/auth';
import { authenticateWithTelegram } from './services/auth';

// Initialize Telegram Web App
init();

// Initialize authentication on app load
const initializeAuth = async () => {
  const { setToken, setUser, logout } = useAuthStore.getState();

  // Check if token exists in localStorage
  const existingToken = localStorage.getItem('token');
  if (existingToken) {
    console.log('[AUTH] Existing token found in localStorage');
    setToken(existingToken);
    return;
  }

  console.log('[AUTH] No existing token, attempting Telegram authentication');

  // Authenticate with Telegram initData
  try {
    const initData = retrieveRawInitData();
    if (!initData) {
      console.error('[AUTH] No initData available from Telegram');
      return;
    }

    console.log('[AUTH] Retrieved initData from Telegram:', {
      length: initData.length,
      preview: initData.substring(0, 100) + '...',
      hasUser: initData.includes('user='),
      hasHash: initData.includes('hash='),
      hasAuthDate: initData.includes('auth_date='),
    });

    const { token, user } = await authenticateWithTelegram(initData);
    console.log('[AUTH] Authentication successful', {
      userId: user.id,
      telegramId: user.telegramId,
      username: user.username,
    });
    setToken(token);
    setUser(user);
  } catch (error) {
    console.error('[AUTH] Authentication failed:', error);
    if (error instanceof Error) {
      console.error('[AUTH] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    logout();
  }
};

initializeAuth();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
