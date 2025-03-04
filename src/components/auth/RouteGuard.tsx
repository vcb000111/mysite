'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMoviesAccess } from '@/contexts/MoviesAccessContext';
import { Toast } from '@/lib/toast.helper';
import { useTheme } from '@/contexts/ThemeContext';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { canAccessRoute } = useMoviesAccess();
  const { isDark } = useTheme();
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!canAccessRoute(pathname)) {
        router.push('/');
        await new Promise(resolve => setTimeout(resolve, 100));
        await Toast.fire({
          icon: 'error',
          title: 'Bạn không có quyền truy cập trang này',
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000'
        });
      } else {
        setCanAccess(true);
      }
    };

    checkAccess();
  }, [pathname, router, canAccessRoute, isDark]);

  // Hiển thị trang trống trong khi kiểm tra quyền truy cập
  if (!canAccess) {
    return null;
  }

  return <>{children}</>;
} 