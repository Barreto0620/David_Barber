// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DollarSign, 
  Settings, 
  Menu,
  Scissors,
  UserCheck,
  Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agendamentos', href: '/appointments', icon: Calendar },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Clientes Mensais', href: '/monthly-clients', icon: UserCheck },
  { name: 'Fidelidade', href: '/loyalty', icon: Gift },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ className, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <Scissors className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">David Barber</h2>
              <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
            </div>
          </div>
          {!isMobile && <ThemeToggle />}
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="block">
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-200 hover:scale-[1.02]",
                  isActive && "bg-primary text-primary-foreground shadow-lg"
                )}
                onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* RODAPÉ: Bordas sutis (padrão) na parte superior e inferior para fechar o retângulo. */}
      <div className="px-4 py-4 border-t border-b"> 
        {isMobile && (
          <div className="mb-4">
            <ThemeToggle />
          </div>
        )}
        <div className="text-xs text-muted-foreground text-center">
          <p>WebCashCompany©</p> 
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden md:flex w-80 flex-col border-r bg-card/50 backdrop-blur-sm", className)}>
        <NavContent />
      </div>
      
      {/* Mobile Sidebar (apenas o Sheet, SEM o botão trigger) */}
      {mobileOpen !== undefined && setMobileOpen && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <NavContent isMobile={true} />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

// Componente separado para o botão do menu mobile (use ESTE no seu header)
export function MobileMenuButton({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="md:hidden transition-all duration-200 hover:scale-110"
      onClick={() => setOpen(!open)}
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}