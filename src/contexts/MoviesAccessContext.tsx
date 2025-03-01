'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

interface MoviesAccessContextType {
  hasAccess: boolean;
  checkGiftCode: (code: string) => boolean;
  extendAccess: (hours: number) => void;
  getRemainingTime: () => number;
  endAccess: () => void;
}

const MoviesAccessContext = createContext<MoviesAccessContextType | undefined>(undefined);

export function MoviesAccessProvider({ children }: { children: ReactNode }) {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Kiểm tra access token và thời gian hết hạn từ cookies
    const accessData = Cookies.get('moviesAccess');
    if (accessData) {
      try {
        const { expiry } = JSON.parse(accessData);
        if (new Date().getTime() < expiry) {
          setHasAccess(true);
        } else {
          Cookies.remove('moviesAccess');
          setHasAccess(false);
        }
      } catch {
        Cookies.remove('moviesAccess');
        setHasAccess(false);
      }
    }
  }, []);

  const checkGiftCode = (code: string): boolean => {
    if (code === '9371') {
      const expiry = new Date().getTime() + (60 * 60 * 1000); // 1 giờ
      Cookies.set('moviesAccess', JSON.stringify({ expiry }), {
        expires: 1 / 24, // 1 giờ
        path: '/',
        sameSite: 'strict'
      });
      setHasAccess(true);
      return true;
    }
    return false;
  };

  const extendAccess = (hours: number) => {
    const accessData = Cookies.get('moviesAccess');
    let currentExpiry = new Date().getTime();

    if (accessData) {
      try {
        const { expiry } = JSON.parse(accessData);
        if (new Date().getTime() < expiry) {
          currentExpiry = expiry;
        }
      } catch { }
    }

    const newExpiry = currentExpiry + (hours * 60 * 60 * 1000);
    Cookies.set('moviesAccess', JSON.stringify({ expiry: newExpiry }), {
      expires: hours / 24,
      path: '/',
      sameSite: 'strict'
    });
    setHasAccess(true);
  };

  const getRemainingTime = (): number => {
    const accessData = Cookies.get('moviesAccess');
    if (accessData) {
      try {
        const { expiry } = JSON.parse(accessData);
        const remaining = expiry - new Date().getTime();
        return Math.max(0, Math.floor(remaining / (60 * 60 * 1000))); // Trả về số giờ còn lại
      } catch {
        return 0;
      }
    }
    return 0;
  };

  // Kiểm tra hết hạn mỗi phút
  useEffect(() => {
    const interval = setInterval(() => {
      const accessData = Cookies.get('moviesAccess');
      if (accessData) {
        try {
          const { expiry } = JSON.parse(accessData);
          if (new Date().getTime() >= expiry) {
            Cookies.remove('moviesAccess');
            setHasAccess(false);
          }
        } catch {
          Cookies.remove('moviesAccess');
          setHasAccess(false);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const endAccess = () => {
    Cookies.remove('moviesAccess');
    setHasAccess(false);
  };

  return (
    <MoviesAccessContext.Provider value={{ hasAccess, checkGiftCode, extendAccess, getRemainingTime, endAccess }}>
      {children}
    </MoviesAccessContext.Provider>
  );
}

export function useMoviesAccess() {
  const context = useContext(MoviesAccessContext);
  if (context === undefined) {
    throw new Error('useMoviesAccess must be used within a MoviesAccessProvider');
  }
  return context;
} 