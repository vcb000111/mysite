'use client';

import {
  Home, Wrench, Gamepad2, Calendar, MessagesSquare, Settings, ChevronLeft, ChevronRight, ChevronDown,
  Calculator, ArrowLeftRight, QrCode, Target, Dices, Puzzle, Sun, Moon,
  BookOpen, PenSquare, ListOrdered, Tags, FolderOpen,
  Film, Plus, ListVideo, Star, Clapperboard
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const menuItems = [
  { icon: Home, label: 'Trang chủ', href: '/' },
  {
    icon: Film,
    label: 'My Movies',
    items: [
      {
        icon: ListVideo,
        label: 'Danh sách phim',
        href: '/movies/list'
      },
      {
        icon: Clapperboard,
        label: 'Thể loại',
        href: '/movies/categories'
      },
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
      { icon: Calculator, label: 'Máy tính', href: '/tools/calculator' },
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
  { icon: Calendar, label: 'Lịch', href: '/calendar' },
  { icon: MessagesSquare, label: 'Tin nhắn', href: '/messages' },
  { icon: Settings, label: 'Cài đặt', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [openDropdown, setOpenDropdown] = useState<string | null>(() => {
    if (pathname.startsWith('/movies/')) return 'My Movies';
    if (pathname.startsWith('/blog/')) return 'Blog';
    if (pathname.startsWith('/tools/')) return 'Tools';
    if (pathname.startsWith('/games/')) return 'Games';
    return null;
  });
  const { isDark, toggleTheme } = useTheme();

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

  const isSubMenuActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isParentActive = (items: { href: string }[]) => {
    return items.some(item => pathname === item.href);
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white shadow-lg dark:bg-gray-900 transition-all duration-200 
      ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo section */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-800">
        <span className="text-xl font-bold animate-gradient-slow">
          {isCollapsed ? 'DP-IT' : 'DP-IT Playground'}
        </span>
      </div>

      {/* Menu items */}
      <nav className="p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasDropdown = !!item.items;
          const isOpen = openDropdown === item.label;

          const isActive = item.href === '/'
            ? pathname === '/'
            : item.href
              ? pathname === item.href
              : item.items?.some(subItem => isSubMenuActive(subItem.href));

          return (
            <div key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                    ${pathname === item.href
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              ) : (
                <div className="mb-2">
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200
                      ${item.items && isParentActive(item.items)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200
                          ${openDropdown === item.label ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>

                  {(openDropdown === item.label || isCollapsed) && (
                    <div className={`mt-1 space-y-1 ${isCollapsed ? 'relative' : 'ml-4'}`}>
                      {item.items?.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                            ${pathname === subItem.href
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                          <subItem.icon className="w-5 h-5" />
                          {!isCollapsed && <span>{subItem.label}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Theme toggle button */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <button
          onClick={toggleTheme}
          className={`flex items-center h-12 rounded-lg transition-all duration-200
            ${isCollapsed ? 'w-12 justify-center' : 'w-[calc(100%-1rem)] px-4'}
            hover:bg-gray-50 dark:hover:bg-gray-800`}
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

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-4 top-20 bg-white dark:bg-gray-900 shadow-lg rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        )}
      </button>
    </div>
  );
} 