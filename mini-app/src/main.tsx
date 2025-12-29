import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { init, retrieveRawInitData } from '@telegram-apps/sdk';
import { useAuthStore } from './stores/auth';
import { authenticateWithTelegram } from './services/auth';
import { ErrorBoundary } from './components/ErrorBoundary';

// Helper function to log to both console and visible UI
const logToUI = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
  // Log to console
  console.log(`[${type.toUpperCase()}] ${message}`);

  // Log to visible UI for debugging in Telegram
  const debugLog = document.getElementById('debug-log');
  if (debugLog) {
    const timestamp = new Date().toISOString();
    const logEntry = document.createElement('div');
    const colors = {
      info: '#3390ec',
      error: '#ff4444',
      success: '#00cc66',
    };
    logEntry.style.cssText = `color: ${colors[type]}; margin: 4px 0; padding: 4px; font-size: 12px; border-left: 3px solid ${colors[type]}; padding-left: 8px;`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    debugLog.appendChild(logEntry);
  }
};

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
        <div id="debug-log" style="
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 200px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          padding: 10px;
          font-size: 11px;
          font-family: monospace;
          z-index: 9999;
        "></div>
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
    logToUI('[STEP 1] Initializing Telegram SDK...', 'info');
    init();
    logToUI('[STEP 1] Telegram SDK initialized successfully', 'success');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logToUI(`[STEP 1] Failed to initialize Telegram SDK: ${errorMessage}`, 'error');
    console.error('[TELEGRAM] Initialization failed:', error);
    return false;
  }
};

// Initialize authentication on app load
const initializeAuth = async () => {
  logToUI('[STEP 2] Starting authentication initialization...', 'info');
  
  const { setToken, setUser, logout } = useAuthStore.getState();

  // Check if token exists in localStorage
  const existingToken = localStorage.getItem('token');
  if (existingToken) {
    logToUI('[STEP 2] Existing token found in localStorage', 'success');
    setToken(existingToken);
    return;
  }

  logToUI('[STEP 2] No existing token, attempting Telegram authentication', 'info');

  // Authenticate with Telegram initData
  try {
    logToUI('[STEP 2] Retrieving initData from Telegram...', 'info');
    const initData = retrieveRawInitData();
    if (!initData) {
      logToUI('[STEP 2] No initData available from Telegram (running outside Telegram?)', 'error');
      logToUI('[STEP 2] App will render without authentication', 'info');
      return;
    }

    logToUI(
      `[STEP 2] Retrieved initData from Telegram: length=${initData.length}, hasUser=${initData.includes('user=')}, hasHash=${initData.includes('hash=')}`,
      'info'
    );

    logToUI('[STEP 2] Calling authenticateWithTelegram API...', 'info');
    const { token, user } = await authenticateWithTelegram(initData);
    logToUI(
      `[STEP 2] Authentication successful: userId=${user.id}, telegramId=${user.telegramId}, username=${user.username}`,
      'success'
    );
    setToken(token);
    setUser(user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logToUI(`[STEP 2] Authentication failed: ${errorMessage}`, 'error');
    console.error('[AUTH] Authentication failed:', error);
    if (error instanceof Error) {
      console.error('[AUTH] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    logout();
    logToUI('[STEP 2] App will render without authentication', 'info');
  }
};

// Main initialization function
const initializeApp = async () => {
  // Show loading indicator immediately
  logToUI('[INIT] Starting app initialization...', 'info');
  showLoadingIndicator();

  // Initialize Telegram SDK
  const telegramInitialized = initializeTelegram();
  logToUI(`[INIT] Telegram initialization completed: ${telegramInitialized}`, telegramInitialized ? 'success' : 'error');

  // Initialize authentication
  logToUI('[INIT] Starting authentication...', 'info');
  await initializeAuth();
  logToUI('[INIT] Authentication initialization completed', 'success');

  // Render React app
  try {
    logToUI('[STEP 3] Rendering React application...', 'info');
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
    logToUI('[STEP 3] React application rendered successfully', 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logToUI(`[STEP 3] Failed to render React application: ${errorMessage}`, 'error');
    console.error('[RENDER] Failed to render app:', error);

    // Show error in UI
    const root = document.getElementById('root');
    if (root) {
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
          <div id="debug-log" style="
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            max-height: 200px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 10px;
            font-size: 11px;
            font-family: monospace;
            z-index: 9999;
          "></div>
        </div>
      `;
    }
  }
};

// Start initialization
logToUI('[SYSTEM] App initialization started', 'info');
initializeApp().catch((error) => {
  logToUI(`[SYSTEM] Unhandled error in initializeApp: ${error}`, 'error');
  console.error('[SYSTEM] Unhandled error:', error);
});
