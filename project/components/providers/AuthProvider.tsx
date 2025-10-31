// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
        }

        if (mounted) {
          setUser(data.session?.user ?? null);
          
          // Se não há usuário e não está na página de login/signup/reset, redireciona
          if (!data.session?.user && !['/login', '/signup', '/reset-password'].includes(pathname)) {
            router.push('/login');
            return;
          }
          
          // Se há usuário e está na página de login/signup, redireciona para dashboard
          if (data.session?.user && ['/login', '/signup'].includes(pathname)) {
            router.push('/');
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    // Listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          
          if (event === 'SIGNED_OUT' || !session) {
            router.push('/login');
          } else if (event === 'SIGNED_IN' && ['/login', '/signup'].includes(pathname)) {
            router.push('/');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se está na página de login/signup/reset, renderiza sem layout
  if (['/login', '/signup', '/reset-password'].includes(pathname)) {
    return <>{children}</>;
  }

  // Se não há usuário autenticado, não renderiza nada (redirecionamento em andamento)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Renderiza com layout principal para usuários autenticados
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}