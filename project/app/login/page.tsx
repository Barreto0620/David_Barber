// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound, Moon, Sun, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
    
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      router.push('/');
    }

    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail antes de resetar a senha');
      return;
    }

    setResetLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setResetSuccess(true);
    }

    setResetLoading(false);
  };

  if (!mounted) {
    return null;
  }

  if (resetSuccess) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 🎥 Vídeo de Fundo */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="video-background"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay escuro */}
        <div className="video-overlay"></div>

        <Card className="relative w-full max-w-md mx-4 shadow-2xl border-0 bg-gray-900/60 backdrop-blur-2xl z-10">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 dark:bg-emerald-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full">
                  <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              E-mail Enviado!
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Verifique sua caixa de entrada</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                Enviamos um link de redefinição de senha para <br />
                <strong className="text-emerald-600 dark:text-emerald-400">{email}</strong>
              </p>
            </div>
            <Button 
              variant="outline" 
              className="w-full h-12 font-medium border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
              onClick={() => setResetSuccess(false)}
            >
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 🎥 Vídeo de Fundo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="video-background"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay escuro para melhor contraste */}
      <div className="video-overlay"></div>

      {/* Botão de tema */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 border border-gray-200 dark:border-gray-700"
        aria-label="Alternar tema"
      >
        {isDark ? (
          <Sun className="h-5 w-5 text-amber-500" />
        ) : (
          <Moon className="h-5 w-5 text-indigo-600" />
        )}
      </button>

      <Card className="relative w-full max-w-md mx-4 shadow-2xl border-0 bg-gray-900/60 backdrop-blur-2xl transition-all duration-500 z-10">
        <CardHeader className="text-center space-y-4 pb-8">
          {/* 🔥 LOGO DO DAVID BARBER */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative">
                <img
                  src="/logo_david_barber.png"
                  alt="David Barber Logo"
                  className="w-24 h-24 rounded-full object-cover shadow-2xl border-4 border-white dark:border-gray-800"
                />
              </div>
            </div>
          </div>
          <div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              David Barber
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email && password) {
                      handleLogin(e);
                    }
                  }}
                  className={`h-12 pl-4 pr-4 transition-all duration-300 backdrop-blur-lg border-2 text-white placeholder:text-white/60 ${
                    emailFocused 
                      ? 'border-blue-400 ring-4 ring-blue-500/20 bg-white/5' 
                      : 'border-white/30 bg-transparent hover:bg-white/5'
                  }`}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email && password) {
                      handleLogin(e);
                    }
                  }}
                  className={`h-12 pl-4 pr-4 transition-all duration-300 backdrop-blur-lg border-2 text-white placeholder:text-white/60 ${
                    passwordFocused 
                      ? 'border-indigo-400 ring-4 ring-indigo-500/20 bg-white/5' 
                      : 'border-white/30 bg-transparent hover:bg-white/5'
                  }`}
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="border-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleLogin}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/10 backdrop-blur-md px-2 text-white/70">
                Precisa de ajuda?
              </span>
            </div>
          </div>

          <Button 
            type="button"
            variant="ghost" 
            className="w-full h-12 font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 group"
            onClick={handleResetPassword}
            disabled={resetLoading}
          >
            <KeyRound className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            {resetLoading ? 'Enviando...' : 'Esqueci minha senha'}
          </Button>
        </CardContent>
      </Card>

      <div className="absolute bottom-6 text-center text-sm text-white/80 dark:text-white/60 z-10">
        <p>WebCashCompany©</p>
      </div>
    </div>
  );
}