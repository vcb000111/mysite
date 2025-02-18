'use client';

import { useSidebar } from "@/contexts/SidebarContext";
import Sidebar from "./Sidebar";

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main className={`flex-1 flex transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
      {children}
    </main>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <MainContent>{children}</MainContent>
    </div>
  );
} 