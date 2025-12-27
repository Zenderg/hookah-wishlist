import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Load Telegram WebApp script
const loadTelegramScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Telegram WebApp script'));
    document.head.appendChild(script);
  });
};

// Initialize Telegram WebApp and render the app
const initializeApp = async () => {
  try {
    // Load Telegram WebApp script
    await loadTelegramScript();

    // Initialize Telegram WebApp if available
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;

      // Set up Telegram WebApp
      tg.ready();
      tg.expand();

      // Apply Telegram theme colors to CSS variables
      const root = document.documentElement;
      const themeParams = tg.themeParams || {};

      if (themeParams.bg_color) {
        root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
      }
      if (themeParams.text_color) {
        root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
      }
      if (themeParams.hint_color) {
        root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
      }
      if (themeParams.link_color) {
        root.style.setProperty('--tg-theme-link-color', themeParams.link_color);
      }
      if (themeParams.button_color) {
        root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
      }
      if (themeParams.button_text_color) {
        root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
      }

      console.log('Telegram WebApp initialized:', {
        version: tg.version,
        platform: tg.platform,
        initData: tg.initData ? 'present' : 'missing',
      });
    } else {
      console.warn('Telegram WebApp not available - running in development mode');
    }
  } catch (error) {
    console.error('Failed to initialize Telegram WebApp:', error);
  }

  // Render the React app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

// Start the app
initializeApp();
