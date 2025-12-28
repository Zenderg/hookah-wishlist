import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';

interface MainButtonContextType {
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  setMainButtonLoading: (isLoading: boolean) => void;
}

const MainButtonContext = createContext<MainButtonContextType | undefined>(undefined);

export const MainButtonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    showMainButton: tgShowMainButton,
    hideMainButton: tgHideMainButton,
    setMainButtonParams,
    onMainButtonClick,
    offMainButtonClick,
  } = useTelegram();

  const currentClickHandler = React.useRef<(() => void) | null>(null);

  const showMainButton = useCallback(
    (text: string, onClick: () => void) => {
      // Remove previous click handler if exists
      if (currentClickHandler.current) {
        offMainButtonClick(currentClickHandler.current);
      }

      // Set new click handler
      currentClickHandler.current = onClick;
      onMainButtonClick(onClick);

      // Show and configure button
      setMainButtonParams({
        text,
        isVisible: true,
        isActive: true,
        isProgressVisible: false,
      });
      tgShowMainButton();
    },
    [tgShowMainButton, setMainButtonParams, onMainButtonClick, offMainButtonClick]
  );

  const hideMainButton = useCallback(() => {
    if (currentClickHandler.current) {
      offMainButtonClick(currentClickHandler.current);
      currentClickHandler.current = null;
    }
    tgHideMainButton();
  }, [tgHideMainButton, offMainButtonClick]);

  const setMainButtonLoading = useCallback(
    (isLoading: boolean) => {
      setMainButtonParams({
        text: '',
        isVisible: true,
        isActive: !isLoading,
        isProgressVisible: isLoading,
      });
    },
    [setMainButtonParams]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentClickHandler.current) {
        offMainButtonClick(currentClickHandler.current);
      }
    };
  }, [offMainButtonClick]);

  return (
    <MainButtonContext.Provider value={{ showMainButton, hideMainButton, setMainButtonLoading }}>
      {children}
    </MainButtonContext.Provider>
  );
};

export const useMainButton = () => {
  const context = useContext(MainButtonContext);
  if (context === undefined) {
    throw new Error('useMainButton must be used within a MainButtonProvider');
  }
  return context;
};
