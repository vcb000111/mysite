'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMoviesAccess } from '@/contexts/MoviesAccessContext';
import Swal from 'sweetalert2';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { canAccessRoute } = useMoviesAccess();

  useEffect(() => {
    if (!canAccessRoute(pathname)) {
      Swal.fire({
        icon: 'error',
        title: 'Không có quyền truy cập',
        text: 'Bạn cần có quyền admin để truy cập trang này.',
        confirmButtonText: 'Quay lại',
        customClass: {
          popup: 'dark:bg-gray-800',
          title: 'text-gray-800 dark:text-white font-medium',
          htmlContainer: 'text-gray-600 dark:text-gray-300',
          confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg'
        }
      }).then(() => {
        router.push('/');
      });
    }
  }, [pathname, canAccessRoute, router]);

  return <>{children}</>;
} 