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
    logToUI('Initializing Telegram SDK...', 'info');
    init();
    logToUI('Telegram SDK initialized successfully', 'success');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logToUI(`Failed to initialize Telegram SDK: ${errorMessage}`, 'error');
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
    logToUI('Existing token found in localStorage', 'success');
    setToken(existingToken);
    return;
  }

  logToUI('No existing token, attempting Telegram authentication', 'info');

  // Authenticate with Telegram initData
  try {
    const initData = retrieveRawInitData();
    if (!initData) {
      logToUI('No initData available from Telegram', 'error');
      return;
    }

    logToUI(
      `Retrieved initData from Telegram: length=${initData.length}, hasUser=${initData.includes('user=')}, hasHash=${initData.includes('hash=')}`,
      'info'
    );

    const { token, user } = await authenticateWithTelegram(initData);
    logToUI(
      `Authentication successful: userId=${user.id}, telegramId=${user.telegramId}, username=${user.username}`,
      'success'
    );
    setToken(token);
    setUser(user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logToUI(`Authentication failed: ${errorMessage}`, 'error');
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
    logToUI('Rendering React application...', 'info');
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    logToUI('React application rendered successfully', 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logToUI(`Failed to render React application: ${errorMessage}`, 'error');
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
initializeApp();
