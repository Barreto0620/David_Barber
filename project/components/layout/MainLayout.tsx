// @ts-nocheck
"use client";

import { User } from "@supabase/supabase-js";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

interface MainLayoutProps {
  children: React.ReactNode;
  user: User;
}

export function MainLayout({ children, user }: MainLayoutProps) {
  // 🆕 Ativa sincronização em tempo real com Supabase
  useRealtimeSync();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}