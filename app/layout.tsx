@@ .. @@
 // app/layout.tsx
 import type { Metadata } from 'next';
 import { Inter } from 'next/font/google';
 import './globals.css';
 import { ThemeProvider } from '@/components/providers/ThemeProvider';
+import { AuthProvider } from '@/components/auth/AuthProvider';
 import { Sidebar } from '@/components/layout/Sidebar';
 import { Toaster } from '@/components/ui/toaster';
+import { Toaster as SonnerToaster } from '@/components/ui/sonner';
 
 const inter = Inter({ subsets: ['latin'] });
 
 export const metadata: Metadata = {
   title: 'David Barber - Sistema de Gestão',
   description: 'Sistema completo para gerenciamento de barbearia',
   keywords: 'barbearia, agendamento, gestão, clientes, financeiro',
   authors: [{ name: 'David Barber Team' }],
   viewport: 'width=device-width, initial-scale=1',
   themeColor: [
     { media: '(prefers-color-scheme: light)', color: 'white' },
     { media: '(prefers-color-scheme: dark)', color: 'black' }
   ]
 };
 
 export default function RootLayout({
   children,
 }: {
   children: React.ReactNode;
 }) {
   return (
     <html lang="pt-BR" suppressHydrationWarning>
       <body className={inter.className}>
         <ThemeProvider
           attribute="class"
           defaultTheme="system"
           enableSystem
           disableTransitionOnChange
         >
-          <div className="min-h-screen bg-background">
-            <div className="flex h-screen overflow-hidden">
-              <Sidebar />
-              <main className="flex-1 overflow-y-auto">
-                <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
-                  {children}
+          <AuthProvider>
+            <div className="min-h-screen bg-background">
+              <div className="flex h-screen overflow-hidden">
+                <Sidebar />
+                <main className="flex-1 overflow-y-auto">
+                  <div className="container mx-auto py-4 px-4 md:py-6 md:px-6 lg:px-8">
+                    {children}
+                  </div>
+                </main>
+              </div>
+            </div>
+            <Toaster />
+            <SonnerToaster 
+              position="top-right"
+              toastOptions={{
+                style: {
+                  background: 'hsl(var(--background))',
+                  border: '1px solid hsl(var(--border))',
+                  color: 'hsl(var(--foreground))',
                 }
-              </main>
-            </div>
-          </div>
-          <Toaster />
+              }}
+            />
+          </AuthProvider>
         </ThemeProvider>
       </body>
     </html>
   );
 }