import { useEffect, useState, useCallback } from 'react';
import { init, retrieveRawInitData, initDataUser } from '@telegram-apps/sdk';

export interface TelegramTheme {
  bgColor?: string;
  textColor?: string;
  hintColor?: string;
  linkColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  secondaryBgColor?: string;
}

export interface MainButtonConfig {
  text: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  color?: string;
  textColor?: string;
}

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<ReturnType<typeof init> | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [user, setUser] = useState<ReturnType<typeof initDataUser> | null>(null);
  const [theme, setTheme] = useState<TelegramTheme>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const cleanup = init();
    const rawInitData = retrieveRawInitData() || '';
    const userData = initDataUser();

    setWebApp(cleanup);
    setInitData(rawInitData);
    setUser(userData);

    // Initialize Telegram WebApp if available
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;

      // Mark the app as ready and expand
      tg.ready();
      tg.expand();

      // Extract theme colors
      const themeParams = tg.themeParams || {};
      setTheme({
        bgColor: themeParams.bg_color,
        textColor: themeParams.text_color,
        hintColor: themeParams.hint_color,
        linkColor: themeParams.link_color,
        buttonColor: themeParams.button_color,
        buttonTextColor: themeParams.button_text_color,
        secondaryBgColor: themeParams.secondary_bg_color,
      });

      setIsReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Haptic feedback functions
  const hapticImpact = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  }, []);

  const hapticNotification = useCallback((type: 'error' | 'success' | 'warning') => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred(type);
    }
  }, []);

  const hapticSelection = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  }, []);

  // MainButton functions
  const showMainButton = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.MainButton) {
      (window as any).Telegram.WebApp.MainButton.show();
    }
  }, []);

  const hideMainButton = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.MainButton) {
      (window as any).Telegram.WebApp.MainButton.hide();
    }
  }, []);

  const setMainButtonText = useCallback((text: string) => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.MainButton) {
      (window as any).Telegram.WebApp.MainButton.setText(text);
    }
  }, []);

  const setMainButtonParams = useCallback((params: Partial<MainButtonConfig>) => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.MainButton) {
      const mainButton = (window as any).Telegram.WebApp.MainButton;

      if (params.text !== undefined) mainButton.setText(params.text);
      if (params.color !== undefined) mainButton.setColor(params.color);
      if (params.textColor !== undefined) mainButton.setTextColor(params.textColor);
      if (params.isActive !== undefined) {
        if (params.isActive) {
          mainButton.enable();
        } else {
          mainButton.disable();
        }
      }
      if (params.isProgressVisible !== undefined) {
        if (params.isProgressVisible) {
          mainButton.showProgress();
        } else {
          mainButton.hideProgress();
        }
      }
    }
  }, []);

  const onMainButtonClick = useCallback((callback: () => void) => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.MainButton) {
      (window as any).Telegram.WebApp.MainButton.onClick(callback);
    }
  }, []);

  const offMainButtonClick = useCallback((callback: () => void) => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.MainButton) {
      (window as any).Telegram.WebApp.MainButton.offClick(callback);
    }
  }, []);

  return {
    webApp,
    initData,
    user,
    theme,
    isReady,
    // Haptic feedback
    hapticImpact,
    hapticNotification,
    hapticSelection,
    // MainButton
    showMainButton,
    hideMainButton,
    setMainButtonText,
    setMainButtonParams,
    onMainButtonClick,
    offMainButtonClick,
  };
};
