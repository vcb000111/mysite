'use client';

import { useSidebar } from "@/contexts/SidebarContext";
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className={`
        transition-all duration-200
        ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}
        pb-16 md:pb-0
      `}>
        {children}
      </main>
    </div>
  );
} 