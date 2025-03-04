'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

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
  const [{ hasAccess, isAdmin }, setState] = useState(getInitialState());
  const router = useRouter();

  // Danh sách route chỉ dành cho admin
  const ADMIN_ONLY_ROUTES = [
    '/movies/manage',
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
    if (PUBLIC_ROUTES.some(publicRoute => route === publicRoute || route.startsWith(publicRoute + '/'))) {
      return true;
    }

    // Kiểm tra route admin
    const isAdminRoute = ADMIN_ONLY_ROUTES.some(adminRoute =>
      route === adminRoute || route.startsWith(adminRoute + '/')
    );

    // Nếu là route admin
    if (isAdminRoute) {
      // Chỉ admin mới có quyền truy cập
      return isAdmin;
    }

    // Kiểm tra route được bảo vệ
    const isProtectedRoute = PROTECTED_ROUTES.some(protectedRoute =>
      route === protectedRoute || route.startsWith(protectedRoute + '/')
    );

    // Nếu là route được bảo vệ
    if (isProtectedRoute) {
      // Cần có quyền truy cập
      return hasAccess;
    }

    // Các route khác cho phép truy cập
    return true;
  };

  // Kiểm tra và cập nhật trạng thái từ cookie
  useEffect(() => {
    let isFirstRun = true;

    const checkAccess = () => {
      const newState = getInitialState();
      const hasStateChanged = newState.hasAccess !== hasAccess || newState.isAdmin !== isAdmin;

      if (hasStateChanged) {
        setState(newState);
      }

      // Chỉ kiểm tra và redirect khi:
      // 1. Không phải lần chạy đầu tiên (để tránh redirect không cần thiết khi load trang)
      // 2. Trạng thái đã thay đổi (để tránh redirect liên tục)
      if (!isFirstRun && hasStateChanged) {
        const currentPath = window.location.pathname;
        if (!canAccessRoute(currentPath)) {
          router.push('/');
        }
      }

      isFirstRun = false;
    };

    // Kiểm tra ngay khi mount
    checkAccess();

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
  }, [router, hasAccess, isAdmin]);

  const checkGiftCode = (code: string): boolean => {
    const currentDate = new Date();
    const ddMMyyyy = `${String(currentDate.getDate()).padStart(2, '0')}${String(currentDate.getMonth() + 1).padStart(2, '0')}${currentDate.getFullYear()}`;
    const isAdminCode = code === `${ddMMyyyy}9371`;
    const isUserCode = code === `${ddMMyyyy}9999`;

    if (isAdminCode || isUserCode) {
      const hours = 1; // Đặt thời gian cho admin là 2 giờ
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
    router.push('/');
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