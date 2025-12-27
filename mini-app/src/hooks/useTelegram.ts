import { useEffect, useState } from 'react';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  isPremium?: boolean;
}

export interface TelegramWebAppData {
  initData: string;
  user: TelegramUser | null;
  themeParams: Record<string, string>;
  version: string;
  platform: string;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
}

// Type for Telegram WebApp
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  version: string;
  platform: string;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  themeParams: Record<string, string>;
  expand: () => void;
  enableClosingConfirmation: () => void;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
    selectionChanged: () => void;
  };
  showAlert: (message: string) => void;
  close: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState<string>('');

  const applyTelegramTheme = (tg: TelegramWebApp) => {
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
  };

  useEffect(() => {
    // Initialize Telegram WebApp SDK
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      setIsReady(true);
      setInitData(tg.initData);

      // Expand the webapp
      tg.expand();

      // Enable closing confirmation
      tg.enableClosingConfirmation();

      // Apply Telegram theme
      applyTelegramTheme(tg);
    } else {
      console.warn('Telegram WebApp SDK not available');
      setIsReady(true);
    }
  }, []);

  const showBackButton = (show: boolean = true) => {
    if (webApp?.BackButton) {
      if (show) {
        webApp.BackButton.show();
      } else {
        webApp.BackButton.hide();
      }
    }
  };

  const onBackButtonClicked = (callback: () => void) => {
    if (webApp?.BackButton) {
      webApp.BackButton.onClick(callback);
    }
  };

  const showMainButton = (show: boolean = true) => {
    if (webApp?.MainButton) {
      if (show) {
        webApp.MainButton.show();
      } else {
        webApp.MainButton.hide();
      }
    }
  };

  const setMainButtonText = (text: string) => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText(text);
    }
  };

  const onMainButtonClicked = (callback: () => void) => {
    if (webApp?.MainButton) {
      webApp.MainButton.onClick(callback);
    }
  };

  const hapticFeedback = {
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred(style);
      }
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred(type);
      }
    },
    selection: () => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.selectionChanged();
      }
    },
  };

  const showAlert = (message: string) => {
    if (webApp?.showAlert) {
      webApp.showAlert(message);
    } else {
      alert(message);
    }
  };

  const close = () => {
    if (webApp?.close) {
      webApp.close();
    }
  };

  return {
    webApp,
    isReady,
    initData,
    user: webApp?.initDataUnsafe?.user || null,
    version: webApp?.version || '',
    platform: webApp?.platform || '',
    showBackButton,
    onBackButtonClicked,
    showMainButton,
    setMainButtonText,
    onMainButtonClicked,
    hapticFeedback,
    showAlert,
    close,
  };
};
