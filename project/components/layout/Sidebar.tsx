// @ts-nocheck
'use client';

import { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
  Gift,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 🚀 OTIMIZAÇÃO: Array estático fora do componente (não recria a cada render)
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Calendário', href: '/calendar', icon: CalendarDays },
  { name: 'Agendamentos', href: '/appointments', icon: Calendar },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Clientes Mensais', href: '/monthly-clients', icon: UserCheck },
  { name: 'Serviços', href: '/services', icon: Sparkles },
  { name: 'Fidelidade', href: '/loyalty', icon: Gift },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

// 🚀 OTIMIZAÇÃO: Componente de item individual memorizado
const NavItem = memo(({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: typeof navigation[0]; 
  isActive: boolean; 
  onClick?: () => void;
}) => {
  const Icon = item.icon;
  
  return (
    <Link href={item.href} className="block" prefetch={true}>
      <Button
        variant={isActive ? "default" : "ghost"}
        className={cn(
          "w-full justify-start",
          isActive && "bg-primary text-primary-foreground shadow-lg"
        )}
        onClick={onClick}
      >
        <Icon className="h-4 w-4 mr-2" />
        {item.name}
      </Button>
    </Link>
  );
});

NavItem.displayName = 'NavItem';

// 🚀 OTIMIZAÇÃO: Componente de conteúdo memorizado
const NavContent = memo(({ isMobile = false, onItemClick }: { isMobile?: boolean; onItemClick?: () => void }) => {
  const pathname = usePathname();
  
  // 🚀 OTIMIZAÇÃO: Memoizar items renderizados
  const navItems = useMemo(() => 
    navigation.map((item) => (
      <NavItem
        key={item.href}
        item={item}
        isActive={pathname === item.href}
        onClick={isMobile ? onItemClick : undefined}
      />
    )),
    [pathname, isMobile, onItemClick]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems}
      </nav>

      {/* Footer */}
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
});

NavContent.displayName = 'NavContent';

// 🚀 OTIMIZAÇÃO: Componente principal com callbacks otimizados
export function Sidebar({ className, mobileOpen, setMobileOpen }: SidebarProps) {
  // 🚀 OTIMIZAÇÃO: useCallback para evitar recriação da função
  const handleMobileClose = useCallback(() => {
    setMobileOpen?.(false);
  }, [setMobileOpen]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden md:flex w-80 flex-col border-r bg-card/50 backdrop-blur-sm", className)}>
        <NavContent />
      </div>
      
      {/* Mobile Sidebar */}
      {mobileOpen !== undefined && setMobileOpen && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <NavContent isMobile={true} onItemClick={handleMobileClose} />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

// 🚀 OTIMIZAÇÃO: Botão mobile memorizado
export const MobileMenuButton = memo(({ 
  open, 
  setOpen 
}: { 
  open: boolean; 
  setOpen: (open: boolean) => void;
}) => {
  // 🚀 OTIMIZAÇÃO: useCallback para toggle
  const handleToggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="md:hidden"
      onClick={handleToggle}
      aria-label="Menu"
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
});

MobileMenuButton.displayName = 'MobileMenuButton';