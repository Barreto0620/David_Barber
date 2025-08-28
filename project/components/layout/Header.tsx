'use client';

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from './Sidebar';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Mobile sidebar trigger */}
        <div className="md:hidden">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold hidden md:block">David Barber</h1>
            <h1 className="text-lg font-semibold md:hidden">David Barber</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative max-w-sm hidden sm:block">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar cliente..." 
                className="pl-8"
              />
            </div>
            
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}