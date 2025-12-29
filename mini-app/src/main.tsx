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
    // Show error to user instead of white screen
    document.getElementById('root')!.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Authentication Failed</h2>
        <p>Please try opening the app again from the Telegram bot.</p>
        <p style="color: #666; font-size: 14px;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    `;
  }
};

initializeAuth();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
