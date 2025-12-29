import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { init, retrieveRawInitData } from '@telegram-apps/sdk';
import { useAuthStore } from './stores/auth';
import { authenticateWithTelegram } from './services/auth';
import { ErrorBoundary } from './components/ErrorBoundary';

// Show immediate loading indicator before React renders
const showLoadingIndicator = () => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: var(--tg-theme-bg-color, #ffffff);
        color: var(--tg-theme-text-color, #000000);
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid var(--tg-theme-secondary-bg-color, #f1f1f1);
          border-top-color: var(--tg-theme-button-color, #3390ec);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        "></div>
        <p style="font-size: 16px; color: var(--tg-theme-hint-color, #999999);">
          Loading...
        </p>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
  }
};

// Initialize Telegram Web App with error handling
const initializeTelegram = () => {
  try {
    init();
    return true;
  } catch (error) {
    console.error('[TELEGRAM] Initialization failed:', error);
    return false;
  }
};

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
      console.warn('[AUTH] No initData available from Telegram (running outside Telegram?)');
      return;
    }

    const { token, user } = await authenticateWithTelegram(initData);
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

// Main initialization function
const initializeApp = async () => {
  // Show loading indicator immediately
  showLoadingIndicator();

  // Initialize Telegram SDK
  initializeTelegram();

  // Initialize authentication
  await initializeAuth();

  // Render React app
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('[RENDER] Failed to render app:', error);

    // Show error in UI
    const root = document.getElementById('root');
    if (root) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      root.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          background-color: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
          text-align: center;
        ">
          <h1 style="color: #ff4444; margin-bottom: 16px;">Application Error</h1>
          <p style="margin-bottom: 20px; color: var(--tg-theme-hint-color, #999999);">
            Failed to load the application. Please try again.
          </p>
          <p style="margin-bottom: 20px; color: var(--tg-theme-hint-color, #999999); font-size: 14px;">
            Error: ${errorMessage}
          </p>
          <button onclick="window.location.reload()" style="
            background-color: var(--tg-theme-button-color, #3390ec);
            color: var(--tg-theme-button-text-color, #ffffff);
            border: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          ">
            Retry
          </button>
        </div>
      `;
    }
  }
};

// Start initialization
initializeApp().catch((error) => {
  console.error('[SYSTEM] Unhandled error:', error);
});
