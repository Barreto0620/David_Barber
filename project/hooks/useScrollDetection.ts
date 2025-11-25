// @ts-nocheck
// hooks/useScrollDetection.ts
'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * Hook otimizado para detectar scroll e controlar visibilidade do sidebar
 * Usa requestAnimationFrame para melhor performance
 */
export function useScrollDetection(threshold: number = 100) {
  useEffect(() => {
    let lastScroll = 0;
    let ticking = false;
    
    const sidebarVisible = useAppStore.getState().sidebarVisible;

    const updateSidebarVisibility = (currentScroll: number) => {
      const currentState = useAppStore.getState().sidebarVisible;

      // Scrollando para baixo - esconder sidebar
      if (currentScroll > threshold && currentScroll > lastScroll) {
        if (currentState) {
          useAppStore.setState({ sidebarVisible: false });
        }
      } 
      // Scrollando para cima ou no topo - mostrar sidebar
      else if (currentScroll < lastScroll || currentScroll < threshold) {
        if (!currentState) {
          useAppStore.setState({ sidebarVisible: true });
        }
      }

      lastScroll = currentScroll;
      ticking = false;
    };

    const handleScroll = () => {
      const currentScroll = window.pageYOffset;

      // Usar requestAnimationFrame para otimização
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateSidebarVisibility(currentScroll);
        });
        ticking = true;
      }
    };

    // Passive event listener para melhor performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);
}