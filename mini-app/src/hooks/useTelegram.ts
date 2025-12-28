import { useEffect, useState } from 'react';
import { init, retrieveRawInitData, initDataUser } from '@telegram-apps/sdk';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<ReturnType<typeof init> | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [user, setUser] = useState<ReturnType<typeof initDataUser> | null>(null);

  useEffect(() => {
    const cleanup = init();
    const rawInitData = retrieveRawInitData() || '';
    const userData = initDataUser();

    setWebApp(cleanup);
    setInitData(rawInitData);
    setUser(userData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { webApp, initData, user };
};
