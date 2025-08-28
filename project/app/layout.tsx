import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'David Barber - Sistema de Gestão',
  description: 'Sistema completo de gestão para barbearia David Barber',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="flex">
            {/* Desktop Sidebar */}
            <Sidebar className="hidden md:flex" />
            
            {/* Main Content */}
            <main className="flex-1 min-h-[calc(100vh-4rem)]">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}