// app/layout.tsx
// @ts-nocheck
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

// AQUI ESTÁ A MUDANÇA: Adicionamos a propriedade 'icons'
export const metadata: Metadata = {
  title: 'David Barber - Sistema de Gestão',
  description: 'Sistema de gerenciamento para barbearia',
  icons: {
    // Aponta para o arquivo que está em /public/favicon.png
    icon: '/favicon.png', 
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="david-barber-theme"
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}