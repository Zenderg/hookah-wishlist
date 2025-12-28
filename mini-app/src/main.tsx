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
    setToken(existingToken);
    return;
  }

  // Authenticate with Telegram initData
  try {
    const initData = retrieveRawInitData();
    if (!initData) {
      console.error('No initData available from Telegram');
      return;
    }

    const { token, user } = await authenticateWithTelegram(initData);
    setToken(token);
    setUser(user);
  } catch (error) {
    console.error('Authentication failed:', error);
    logout();
  }
};

initializeAuth();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
