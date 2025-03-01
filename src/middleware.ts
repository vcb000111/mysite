import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Kiểm tra nếu route bắt đầu bằng /movies
  if (request.nextUrl.pathname.startsWith('/movies')) {
    const accessData = request.cookies.get('moviesAccess');

    if (!accessData?.value) {
      // Nếu không có quyền truy cập, chuyển hướng về trang chủ
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const { expiry } = JSON.parse(accessData.value);
      if (new Date().getTime() >= expiry) {
        // Nếu đã hết hạn, chuyển hướng về trang chủ
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('moviesAccess');
        return response;
      }
    } catch {
      // Nếu có lỗi khi parse JSON, xóa cookie và chuyển hướng về trang chủ
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('moviesAccess');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/movies/:path*',
}; 