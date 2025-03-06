'use client';

import {
  Home, Wrench, Gamepad2, Calendar, MessagesSquare, Settings, ChevronLeft, ChevronRight, ChevronDown,
  Calculator, ArrowLeftRight, QrCode, Target, Dices, Puzzle, Sun, Moon,
  BookOpen, PenSquare, ListOrdered, Tags, FolderOpen,
  Film, Plus, ListVideo, Star, Clapperboard, ChevronUp, Clock, LogOut, Menu
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMoviesAccess } from '@/contexts/MoviesAccessContext';
import Swal from 'sweetalert2';

interface MenuItem {
  icon: any;
  label: string;
  href?: string;
  requiresAccess?: boolean;
  items?: SubMenuItem[];
}

interface SubMenuItem {
  icon: any;
  label: string;
  href?: string;
  onClick?: {
    type: 'extend' | 'end';
    handler: (handleClick: () => void) => Promise<boolean | number>;
  };
  requiresAdmin?: boolean;
}

const createMenuItems = (
  handleExtend: (handleClick: () => void) => Promise<number | boolean>,
  handleEnd: (handleClick: () => void) => Promise<boolean>
): MenuItem[] => [
    { icon: Home, label: 'Trang chủ', href: '/' },
    {
      icon: Film,
      label: 'My Movies',
      requiresAccess: true,
      items: [
        {
          icon: Wrench, // Đổi icon sang Wrench để phù hợp với quản lý
          label: 'Quản lý phim',
          href: '/movies/manage',
          requiresAdmin: true
        },
        {
          icon: ListVideo,
          label: 'Danh sách phim',
          href: '/movies/view',
          requiresAdmin: false
        },
        {
          icon: Clapperboard,
          label: 'Thể loại',
          href: '/movies/categories',
          requiresAdmin: true
        },
        {
          icon: Star,
          label: 'Kiểm tra phim',
          href: '/movies/check',
          requiresAdmin: true
        },
        {
          icon: Clock,
          label: 'Gia hạn truy cập',
          onClick: {
            type: 'extend',
            handler: handleExtend
          }
        },
        {
          icon: LogOut,
          label: 'Kết thúc phiên làm việc',
          onClick: {
            type: 'end',
            handler: handleEnd
          }
        }
      ]
    },
    {
      icon: BookOpen,
      label: 'Blog',
      items: [
        { icon: PenSquare, label: 'Viết bài mới', href: '/blog/new' },
        { icon: ListOrdered, label: 'Quản lý bài viết', href: '/blog/posts' },
        { icon: Tags, label: 'Thẻ', href: '/blog/tags' },
        { icon: FolderOpen, label: 'Danh mục', href: '/blog/categories' },
      ]
    },
    {
      icon: Wrench,
      label: 'Tools',
      items: [
        { icon: ArrowLeftRight, label: 'Chuyển đổi tiền tệ', href: '/tools/converter' },
        { icon: QrCode, label: 'Tạo mã QR', href: '/tools/qr-code' },
      ]
    },
    {
      icon: Gamepad2,
      label: 'Games',
      items: [
        { icon: Target, label: 'Cờ caro', href: '/games/tic-tac-toe' },
        { icon: Dices, label: 'Rắn săn mồi', href: '/games/snake' },
        { icon: Puzzle, label: 'Xếp hình', href: '/games/puzzle' },
      ]
    },
    { icon: Settings, label: 'Cài đặt', href: '/settings' },
  ];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { hasAccess, isAdmin, checkGiftCode, extendAccess, getRemainingTime, endAccess, canAccessRoute } = useMoviesAccess();
  const { isDark, toggleTheme } = useTheme();

  const handleExtend = async (handleClick: () => void): Promise<number | boolean> => {
    const result = await Swal.fire({
      title: 'Gia hạn truy cập',
      input: 'number',
      inputPlaceholder: 'Nhập số giờ...',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      inputValidator: (value) => {
        if (!value) {
          return 'Vui lòng nhập số giờ!';
        }
        const hours = parseInt(value);
        if (hours <= 0) {
          return 'Số giờ phải lớn hơn 0!';
        }
        if (hours > 24) {
          return 'Không thể gia hạn quá 24 giờ!';
        }
        return null;
      },
      customClass: {
        popup: `${isDark ? 'dark-mode' : ''}`,
        title: `text-gray-800 dark:text-white font-medium`,
        input: `bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600`,
        confirmButton: `bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg`,
        cancelButton: `bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg`,
      },
      background: isDark ? '#1f2937' : '#ffffff',
    });

    if (result.isConfirmed) {
      const hours = parseInt(result.value);
      handleClick();
      return hours;
    }
    return false;
  };

  const handleEnd = async (handleClick: () => void) => {
    const result = await Swal.fire({
      title: 'Xác nhận kết thúc',
      text: 'Bạn có chắc chắn muốn kết thúc phiên làm việc? Bạn sẽ cần nhập lại giftcode để truy cập lại.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      customClass: {
        popup: `${isDark ? 'dark-mode' : ''}`,
        title: `text-gray-800 dark:text-white font-medium`,
        htmlContainer: `text-gray-600 dark:text-gray-300`,
        confirmButton: `bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg`,
        cancelButton: `bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg`,
      },
      background: isDark ? '#1f2937' : '#ffffff',
    });

    if (result.isConfirmed) {
      endAccess();
      handleClick();
      await Swal.fire({
        icon: 'success',
        title: 'Đã kết thúc!',
        text: 'Phiên làm việc đã được kết thúc.',
        timer: 2000,
        customClass: {
          popup: `${isDark ? 'dark-mode' : ''}`,
          title: `text-gray-800 dark:text-white font-medium`,
          htmlContainer: `text-gray-600 dark:text-gray-300`,
        },
        background: isDark ? '#1f2937' : '#ffffff',
      });
      return true;
    }
    return false;
  };

  const menuItems = createMenuItems(handleExtend, handleEnd);

  const [openDropdown, setOpenDropdown] = useState<string | null>(() => {
    if (pathname.startsWith('/movies/')) return 'My Movies';
    if (pathname.startsWith('/blog/')) return 'Blog';
    if (pathname.startsWith('/tools/')) return 'Tools';
    if (pathname.startsWith('/games/')) return 'Games';
    return null;
  });

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Thêm useEffect để tự động ẩn sidebar khi chuyển trang trên mobile
  useEffect(() => {
    if (window.innerWidth < 768 && !isCollapsed) {
      toggleSidebar();
    }
  }, [pathname]); // Theo dõi sự thay đổi của pathname

  // Thêm useEffect để tự động ẩn sidebar trên mobile khi load trang
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !isCollapsed) { // 768px là breakpoint của md
        toggleSidebar();
      }
    };

    // Kiểm tra khi component mount
    handleResize();

    // Thêm event listener để kiểm tra khi resize window
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array vì chỉ cần chạy một lần khi mount

  useEffect(() => {
    if (pathname.startsWith('/movies/')) {
      setOpenDropdown('My Movies');
    } else if (pathname.startsWith('/blog/')) {
      setOpenDropdown('Blog');
    } else if (pathname.startsWith('/tools/')) {
      setOpenDropdown('Tools');
    } else if (pathname.startsWith('/games/')) {
      setOpenDropdown('Games');
    } else {
      setOpenDropdown(null);
    }
  }, [pathname]);

  const toggleDropdown = (label: string) => {
    if (openDropdown === label) {
      const isInSubPage = (
        (label === 'My Movies' && pathname.startsWith('/movies/')) ||
        (label === 'Blog' && pathname.startsWith('/blog/')) ||
        (label === 'Tools' && pathname.startsWith('/tools/')) ||
        (label === 'Games' && pathname.startsWith('/games/'))
      );
      if (!isInSubPage) {
        setOpenDropdown(null);
      }
    } else {
      setOpenDropdown(label);
    }
  };

  const isSubMenuActive = (href: string | undefined) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isParentActive = (items: SubMenuItem[]) => {
    return items.some(item => item.href && pathname === item.href);
  };

  const handleGiftCodeClick = async () => {
    const result = await Swal.fire({
      title: 'Nhập Giftcode',
      input: 'text',
      inputPlaceholder: 'Nhập giftcode của bạn...',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      customClass: {
        popup: `${isDark ? 'dark-mode' : ''}`,
        title: `text-gray-800 dark:text-white font-medium`,
        input: `bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600`,
        confirmButton: `bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg`,
        cancelButton: `bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg`,
      },
      background: isDark ? '#1f2937' : '#ffffff',
      inputAttributes: {
        autocapitalize: 'off',
        autocomplete: 'off', // Ngăn trình duyệt lưu thông tin input
        spellcheck: 'false'
      },
      inputValidator: (value) => {
        if (!value) {
          return 'Vui lòng nhập giftcode!';
        }
        return null;
      }
    });

    if (result.isConfirmed) {
      const isValid = checkGiftCode(result.value);
      if (isValid) {
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Bạn đã mở khóa menu Movies trong 1 giờ.',
          timer: 2000,
          customClass: {
            popup: `${isDark ? 'dark-mode' : ''}`,
            title: `text-gray-800 dark:text-white font-medium`,
            htmlContainer: `text-gray-600 dark:text-gray-300`,
          },
          background: isDark ? '#1f2937' : '#ffffff',
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Giftcode không hợp lệ!',
          text: 'Vui lòng kiểm tra lại giftcode.',
          customClass: {
            popup: `${isDark ? 'dark-mode' : ''}`,
            title: `text-gray-800 dark:text-white font-medium`,
            htmlContainer: `text-gray-600 dark:text-gray-300`,
          },
          background: isDark ? '#1f2937' : '#ffffff',
        });
      }
    }
  };

  const handleMenuItemClick = async (item: SubMenuItem) => {
    if (item.onClick) {
      const result = await item.onClick.handler(() => {
        if (openDropdown === item.label) {
          setOpenDropdown(null);
        }
      });

      if (item.onClick.type === 'extend' && typeof result === 'number') {
        extendAccess(result);
        const remainingTime = getRemainingTime();
        await Swal.fire({
          icon: 'success',
          title: 'Gia hạn thành công!',
          text: `Thời gian truy cập còn lại: ${remainingTime} giờ`,
          timer: 2000,
          customClass: {
            popup: `${isDark ? 'dark-mode' : ''}`,
            title: `text-gray-800 dark:text-white font-medium`,
            htmlContainer: `text-gray-600 dark:text-gray-300`,
          },
          background: isDark ? '#1f2937' : '#ffffff',
        });
      }
    } else if (item.href) {
      // Xử lý navigation như bình thường
    }
  };

  // Thêm nút Nhập giftcode vào đầu navigation
  const giftCodeButton = (
    <button
      onClick={handleGiftCodeClick}
      className={`flex items-center ${isCollapsed ? 'justify-center' : ''} gap-1 px-2 py-2 rounded-lg transition-all duration-200
        text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-sm md:text-base`}
    >
      <Plus className="w-5 h-5" />
      {!isCollapsed && <span>Nhập giftcode</span>}
    </button>
  );

  return (
    <>
      {/* Mobile overlay khi sidebar mở rộng */}
      {!isCollapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile Float Buttons */}
      <div className="md:hidden fixed bottom-2 right-2 z-50 flex gap-2">
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-all duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div
        className={`fixed transition-all duration-200 bg-white shadow-lg dark:bg-gray-900
        md:left-0 md:top-0 md:h-screen 
        ${isCollapsed ? 'md:w-16' : 'md:w-64'}
        ${isCollapsed
            ? '-bottom-[100vh]'
            : 'bottom-0 left-0 right-0 h-[85vh]'
          }
        z-50 md:z-30 overflow-y-auto`}
      >
        {/* Logo section */}
        <div className="flex items-center justify-between h-12 px-3 border-b border-gray-200 dark:border-gray-800">
          <span className="text-lg font-bold animate-gradient-slow">
            {isCollapsed ? 'Mink' : 'Bảo Mink Site'}
          </span>

          {/* Mobile toggle button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg
              text-gray-600 dark:text-gray-300"
          >
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Menu items - Hiển thị đầy đủ trên desktop và khi mở rộng trên mobile */}
        <nav className={`${isCollapsed ? 'hidden' : ''} md:block p-2 overflow-y-auto h-[calc(100%-3rem)]`}>
          {giftCodeButton}
          {menuItems.map((item) => {
            if (item.requiresAccess && !hasAccess) {
              return null;
            }

            const Icon = item.icon;
            const hasDropdown = !!item.items;
            const isOpen = openDropdown === item.label;

            // Lọc các submenu dựa trên quyền truy cập
            const accessibleItems = item.items?.filter(subItem => {
              if (subItem.requiresAdmin && !isAdmin) return false;
              if (subItem.href && !canAccessRoute(subItem.href)) return false;
              return true;
            });

            // Nếu không có submenu nào có quyền truy cập, ẩn cả menu cha
            if (hasDropdown && (!accessibleItems || accessibleItems.length === 0)) {
              return null;
            }

            const isActive = item.href === '/'
              ? pathname === '/'
              : item.href
                ? pathname === item.href
                : accessibleItems?.some(subItem => isSubMenuActive(subItem.href));

            return (
              <div key={item.label} className="mb-1">
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : ''} gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 text-sm md:text-base
                      ${pathname === item.href
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                ) : (
                  <div className="mb-1">
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-2.5 py-1.5 rounded-lg transition-all duration-200 text-sm md:text-base    
                        ${accessibleItems && isParentActive(accessibleItems)
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''} gap-2`}>
                        <Icon className="w-4 h-4" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>
                      {!isCollapsed && hasDropdown && accessibleItems && accessibleItems.length > 0 && (
                        <ChevronDown
                          className={`w-3 h-3 transition-transform duration-200
                            ${openDropdown === item.label ? 'rotate-180' : ''}`}
                        />
                      )}
                    </button>

                    {(openDropdown === item.label || isCollapsed) && accessibleItems && (
                      <div className={`mt-1 space-y-1 ${isCollapsed ? 'relative' : 'ml-3'}`}>
                        {accessibleItems.map((subItem) => (
                          <div key={subItem.href || subItem.label}>
                            {subItem.onClick ? (
                              <button
                                onClick={() => handleMenuItemClick(subItem)}
                                className={`flex items-center ${isCollapsed ? 'justify-center' : ''} gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 w-full text-sm md:text-base
                                  text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`}
                              >
                                <subItem.icon className="w-4 h-4" />
                                {!isCollapsed && <span>{subItem.label}</span>}
                              </button>
                            ) : (
                              <Link
                                href={subItem.href || '#'}
                                className={`flex items-center ${isCollapsed ? 'justify-center' : ''} gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 text-sm md:text-base
                                  ${pathname === subItem.href
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                  }`}
                              >
                                <subItem.icon className="w-4 h-4" />
                                {!isCollapsed && <span>{subItem.label}</span>}
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Theme toggle button trong menu mở rộng - Chỉ hiển thị trên mobile */}
          <div className="md:hidden mt-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 text-sm md:text-base
                text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span>Chế độ sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-600" />
                  <span>Chế độ tối</span>
                </>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile navigation - Ẩn hoàn toàn trên mobile */}
        <nav className="hidden md:hidden flex items-center justify-around h-full px-4">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href || '#'}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setShowMobileMenu(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile expanded menu header */}
        {!isCollapsed && (
          <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">Menu</span>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg
                text-gray-600 dark:text-gray-300"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Theme toggle button - Chỉ hiển thị trên desktop */}
        <div className="hidden md:flex absolute bottom-4 left-0 right-0 flex-col gap-2">
          {/* Toggle Sidebar Button */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center h-12 rounded-lg transition-all duration-200
              ${isCollapsed ? 'w-12 justify-center' : 'w-[calc(100%-1rem)] px-4'}
              hover:bg-gray-50 dark:hover:bg-gray-800 mx-auto`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
            <span
              className={`ml-3 font-medium whitespace-nowrap transition-all duration-200 
                ${isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'}
                text-gray-700 dark:text-gray-300`}
            >
              Thu gọn menu
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center h-12 rounded-lg transition-all duration-200
              ${isCollapsed ? 'w-12 justify-center' : 'w-[calc(100%-1rem)] px-4'}
              hover:bg-gray-50 dark:hover:bg-gray-800 mx-auto`}
          >
            <div className={`flex items-center w-full transition-all duration-200 ${!isCollapsed && 'group-hover:translate-x-2.5'}`}>
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600" />
              )}
              <span
                className={`ml-3 font-medium whitespace-nowrap transition-all duration-200 
                  ${isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'}
                  text-gray-700 dark:text-gray-300`}
              >
                {isDark ? 'Chế độ sáng' : 'Chế độ tối'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
} 