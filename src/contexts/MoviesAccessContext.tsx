'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

interface MoviesAccessContextType {
  hasAccess: boolean;
  isAdmin: boolean;
  checkGiftCode: (code: string) => boolean;
  extendAccess: (hours: number) => void;
  getRemainingTime: () => number;
  endAccess: () => void;
  canAccessRoute: (route: string) => boolean;
}

const MoviesAccessContext = createContext<MoviesAccessContextType | undefined>(undefined);

// Helper function để lấy trạng thái từ cookie
const getInitialState = () => {
  const accessData = Cookies.get('moviesAccess');
  if (accessData) {
    try {
      const { expiry, isAdmin } = JSON.parse(accessData);
      const now = new Date().getTime();
      if (now < expiry) {
        return { hasAccess: true, isAdmin };
      }
      Cookies.remove('moviesAccess');
    } catch (error) {
      console.error('Error parsing access cookie:', error);
      Cookies.remove('moviesAccess');
    }
  }
  return { hasAccess: false, isAdmin: false };
};

export function MoviesAccessProvider({ children }: { children: ReactNode }) {
  // Khởi tạo state với giá trị từ cookie
  const [{ hasAccess, isAdmin }, setState] = useState(getInitialState());

  // Danh sách route chỉ dành cho admin
  const ADMIN_ONLY_ROUTES = [
    '/movies/list',
    '/movies/categories',
    '/movies/check'
  ];

  // Danh sách route yêu cầu đăng nhập
  const PROTECTED_ROUTES = [
    '/movies'
  ];

  // Danh sách route công khai
  const PUBLIC_ROUTES = [
    '/',
    '/blog',
    '/tools',
    '/games'
  ];

  // Kiểm tra quyền truy cập route
  const canAccessRoute = (route: string): boolean => {
    // Cho phép truy cập các route công khai
    if (PUBLIC_ROUTES.some(publicRoute => route.startsWith(publicRoute))) {
      return true;
    }

    // Nếu là admin, cho phép truy cập tất cả
    if (isAdmin) {
      return true;
    }

    // Nếu là route admin mà không phải admin thì chặn
    if (ADMIN_ONLY_ROUTES.some(adminRoute => route.startsWith(adminRoute))) {
      return false;
    }

    // Nếu là route được bảo vệ thì cần hasAccess
    if (PROTECTED_ROUTES.some(protectedRoute => route.startsWith(protectedRoute))) {
      return hasAccess;
    }

    // Các route khác cho phép truy cập
    return true;
  };

  // Kiểm tra và cập nhật trạng thái từ cookie
  useEffect(() => {
    const checkAccess = () => {
      const newState = getInitialState();
      setState(newState);
    };

    // Kiểm tra mỗi phút
    const interval = setInterval(checkAccess, 60000);

    // Thêm event listener cho storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'moviesAccess') {
        checkAccess();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkGiftCode = (code: string): boolean => {
    const isAdminCode = code === '93719371';
    const isUserCode = code === '9999';

    if (isAdminCode || isUserCode) {
      const hours = isAdminCode ? 24 : 1;
      const expiry = new Date().getTime() + (hours * 60 * 60 * 1000);
      const newState = { hasAccess: true, isAdmin: isAdminCode };

      // Lưu vào cookie
      Cookies.set('moviesAccess', JSON.stringify({
        expiry,
        isAdmin: isAdminCode
      }), {
        expires: hours / 24,
        path: '/',
        sameSite: 'strict'
      });

      // Cập nhật state
      setState(newState);

      return true;
    }

    return false;
  };

  const extendAccess = (hours: number) => {
    const accessData = Cookies.get('moviesAccess');
    let currentExpiry = new Date().getTime();
    let currentIsAdmin = isAdmin;

    if (accessData) {
      try {
        const { expiry } = JSON.parse(accessData);
        if (new Date().getTime() < expiry) {
          currentExpiry = expiry;
        }
      } catch (error) {
        console.error('Error parsing access data:', error);
      }
    }

    // Giới hạn thời gian gia hạn
    const maxHours = currentIsAdmin ? 24 : 1;
    const actualHours = Math.min(hours, maxHours);
    const newExpiry = currentExpiry + (actualHours * 60 * 60 * 1000);

    // Lưu vào cookie
    Cookies.set('moviesAccess', JSON.stringify({
      expiry: newExpiry,
      isAdmin: currentIsAdmin
    }), {
      expires: actualHours / 24,
      path: '/',
      sameSite: 'strict'
    });

    setState({ hasAccess: true, isAdmin: currentIsAdmin });
  };

  const getRemainingTime = (): number => {
    const accessData = Cookies.get('moviesAccess');
    if (accessData) {
      try {
        const { expiry } = JSON.parse(accessData);
        const remaining = expiry - new Date().getTime();
        return Math.max(0, Math.floor(remaining / (60 * 60 * 1000)));
      } catch (error) {
        console.error('Error calculating remaining time:', error);
        return 0;
      }
    }
    return 0;
  };

  const endAccess = () => {
    Cookies.remove('moviesAccess');
    setState({ hasAccess: false, isAdmin: false });
  };

  return (
    <MoviesAccessContext.Provider value={{
      hasAccess,
      isAdmin,
      checkGiftCode,
      extendAccess,
      getRemainingTime,
      endAccess,
      canAccessRoute
    }}>
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