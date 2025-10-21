"use client";

import { Bell, Search, LogOut, X, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "./Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Header() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setIsLoggingOut(false);
    }
  }

  function handleLogoutClick() {
    setShowLogoutModal(true);
  }

  function handleCancelLogout() {
    setShowLogoutModal(false);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 gap-4">
          {/* Mobile sidebar */}
          <div className="md:hidden">
            <Sidebar />
          </div>

          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold hidden md:block">David Barber</h1>
              <h1 className="text-lg font-semibold md:hidden">David Barber</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="icon" onClick={handleLogoutClick}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Confirmação de Logout - Tema Barbearia */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="relative bg-zinc-900 rounded-3xl shadow-2xl max-w-md w-full border-2 border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Header do Modal */}
            <div className="p-8 pb-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* Círculo decorativo externo */}
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-xl"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-zinc-800 to-black rounded-full flex items-center justify-center shadow-xl border-4 border-zinc-700/50">
                    <Scissors size={36} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-center text-white mb-2 tracking-tight">
                Encerrar Sessão?
              </h3>
              <p className="text-zinc-400 text-center text-sm">
                Confirme para sair da sua conta
              </p>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-8 pb-8">
              <div className="bg-zinc-800/50 rounded-2xl p-6 mb-6 border border-zinc-700/50">
                <p className="text-zinc-300 text-center leading-relaxed">
                  Você será desconectado.
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelLogout}
                  disabled={isLoggingOut}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saindo...</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={20} strokeWidth={2.5} />
                      <span>Confirmar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Botão fechar no canto */}
            <button
              onClick={handleCancelLogout}
              disabled={isLoggingOut}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}