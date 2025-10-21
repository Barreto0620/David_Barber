'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scissors, KeyRound, Moon, Sun, Mail, Lock, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

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
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-emerald-950 dark:to-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 dark:bg-emerald-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300 dark:bg-teal-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <Card className="relative w-full max-w-md mx-4 shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-gray-900 transition-colors duration-500">
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

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-32 left-40 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <Card className="relative w-full max-w-md mx-4 shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl transition-all duration-500">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-full shadow-lg">
                <Scissors className="h-10 w-10 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              David Barber
            </CardTitle>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
              <Sparkles className="h-4 w-4" />
              Sistema de Gestão para Barbearia
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
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
                  className={`h-12 pl-4 pr-4 transition-all duration-300 bg-gray-50 dark:bg-gray-800 border-2 ${
                    emailFocused 
                      ? 'border-blue-500 dark:border-blue-400 ring-4 ring-blue-100 dark:ring-blue-900/30' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
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
                  className={`h-12 pl-4 pr-4 transition-all duration-300 bg-gray-50 dark:bg-gray-800 border-2 ${
                    passwordFocused 
                      ? 'border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-100 dark:ring-indigo-900/30' 
                      : 'border-gray-200 dark:border-gray-700'
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
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                Precisa de ajuda?
              </span>
            </div>
          </div>

          <Button 
            type="button"
            variant="ghost" 
            className="w-full h-12 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group"
            onClick={handleResetPassword}
            disabled={resetLoading}
          >
            <KeyRound className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            {resetLoading ? 'Enviando...' : 'Esqueci minha senha'}
          </Button>
        </CardContent>
      </Card>

      <div className="absolute bottom-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>WebCashCompany©</p>
      </div>
    </div>
  );
}