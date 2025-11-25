// @ts-nocheck
// components/layout/MainLayout.tsx
"use client";

import { useState } from "react";
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

  // 🔥 NOVO: Estado para controlar menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* 🔥 Sidebar com props para mobile e scroll inteligente */}
      <Sidebar 
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* 🔥 Main com scroll para ativar detecção do sidebar */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}