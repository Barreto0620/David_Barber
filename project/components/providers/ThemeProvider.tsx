// @ts-nocheck
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light';
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'david-barber-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('light');

  // Função para obter o tema atual do sistema
  const getSystemTheme = useCallback((): 'dark' | 'light' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Função para aplicar o tema ao DOM
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement;
    
    // Remove ambas as classes
    root.classList.remove('light', 'dark');

    // Determina qual tema aplicar
    const themeToApply = newTheme === 'system' ? getSystemTheme() : newTheme;
    
    // Adiciona a classe correta
    root.classList.add(themeToApply);
    
    // Atualiza o estado do tema atual
    setActualTheme(themeToApply);
    
    console.log(`🎨 Tema aplicado: ${themeToApply} (selecionado: ${newTheme})`);
  }, [getSystemTheme]);

  // Aplica o tema inicial e quando muda
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listener para mudanças no tema do sistema
  useEffect(() => {
    // Só adiciona o listener se o tema for "system"
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryList | MediaQueryListEvent) => {
      const newSystemTheme = 'matches' in e ? (e.matches ? 'dark' : 'light') : getSystemTheme();
      console.log(`🌓 Sistema mudou para: ${newSystemTheme}`);
      
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newSystemTheme);
      setActualTheme(newSystemTheme);
    };

    // Tenta usar a API moderna primeiro
    try {
      mediaQuery.addEventListener('change', handleChange);
      console.log('✅ Listener do sistema ativado (addEventListener)');
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
        console.log('🔴 Listener do sistema removido');
      };
    } catch (e) {
      // Fallback para navegadores antigos
      try {
        mediaQuery.addListener(handleChange);
        console.log('✅ Listener do sistema ativado (addListener - fallback)');
        return () => mediaQuery.removeListener(handleChange);
      } catch (e2) {
        console.error('❌ Não foi possível adicionar listener do sistema', e2);
      }
    }
  }, [theme, getSystemTheme]);

  // Função pública para mudar o tema
  const setTheme = useCallback((newTheme: Theme) => {
    console.log(`🎨 Mudando tema de "${theme}" para "${newTheme}"`);
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme,
    actualTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};