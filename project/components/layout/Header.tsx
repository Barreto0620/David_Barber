// src/components/layout/Header.tsx
"use client";

import { Bell, LogOut, X, Scissors, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sidebar } from "./Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Estados de notificação do Zustand
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    setNotifications
  } = useAppStore();

  // Função para limpar todas as notificações
  const clearAllNotifications = () => {
    if (setNotifications) {
      setNotifications([]);
    } else {
      // Fallback: remover uma por uma se setNotifications não existir
      notifications.forEach(notification => {
        removeNotification(notification.id);
      });
    }
  };

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return '📅';
      case 'cancellation':
        return '❌';
      case 'reminder':
        return '⏰';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Padding lateral ajustado (px-4 para mobile, px-8 para desktop) - Mantido para corrigir a margem */}
        <div className="flex h-16 items-center px-4 md:px-8 gap-4"> 
          {/* Mobile sidebar */}
          <div className="md:hidden">
            <Sidebar />
          </div>

          <div className="flex-1 flex items-center justify-between">
            {/* Contêiner do Logo e Título */}
            <div className="flex items-center space-x-4">
              
              {/* Logo Redondo, Linkado para o Dashboard */}
              <h1 className="hidden md:block">
                <a 
                  onClick={() => router.push("/")} 
                  className="cursor-pointer flex items-center h-full hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="/logo_david_barber.png"
                    alt="David Barber Logo"
                    // Tamanho w-12 h-12 mantido. Renderização ajustada: Borda fina e shadow.
                    className="w-12 h-12 rounded-full object-cover shadow-md border border-zinc-700" 
                  />
                </a>
              </h1>

              {/* Título (Mobile) */}
              <h1 className="text-lg font-semibold md:hidden">David Barber</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Sino de Notificações com Popover */}
              <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        variant="destructive"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="end">
                  <div className="flex items-center justify-between p-4 border-b">
                    <div>
                      <h3 className="font-semibold text-lg">Notificações</h3>
                      <p className="text-xs text-muted-foreground">
                        {unreadCount > 0
                          ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
                          : 'Nenhuma nova notificação'
                        }
                      </p>
                    </div>
                    {notifications.length > 0 && (
                      <div className="flex gap-1">
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs h-8"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Marcar todas
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAllNotifications();
                          }}
                          className="text-xs text-destructive hover:text-destructive h-8"
                          title="Limpar todas as notificações"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Nenhuma notificação</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              'p-4 hover:bg-muted/50 transition-colors cursor-pointer relative',
                              !notification.read && 'bg-primary/5'
                            )}
                            onClick={() => handleNotificationClick(notification.id)}
                          >
                            {!notification.read && (
                              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                            )}

                            <div className="flex gap-3 pl-4">
                              <span className="text-2xl shrink-0">{getNotificationIcon(notification.type)}</span>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="font-medium text-sm leading-tight">
                                    {notification.title}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeNotification(notification.id);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>

                                <p className="text-xs text-muted-foreground mb-2">
                                  {notification.message}
                                </p>

                                {notification.clientName && (
                                  <div className="text-xs space-y-1 mb-2 bg-muted/50 p-2 rounded">
                                    <p><strong>Cliente:</strong> {notification.clientName}</p>
                                    {notification.serviceType && (
                                      <p><strong>Serviço:</strong> {notification.serviceType}</p>
                                    )}
                                    {notification.scheduledDate && (
                                      <p><strong>Horário:</strong> {new Date(notification.scheduledDate).toLocaleString('pt-BR')}</p>
                                    )}
                                  </div>
                                )}

                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

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