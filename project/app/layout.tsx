// app/layout.tsx
// @ts-nocheck
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

// Metadata com configurações para melhor responsividade
export const metadata: Metadata = {
  title: 'David Barber - Gestão de Barbearia',
  description: 'Sistema de gerenciamento para barbearia',
  icons: {
    // Aponta para o arquivo que está em /public/favicon.png
    icon: '/favicon.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
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