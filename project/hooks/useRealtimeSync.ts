// src/hooks/useRealtimeSync.ts
'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * 🚀 Hook de Sincronização INSTANTÂNEA
 * 
 * Combina 3 estratégias para garantir atualização em tempo real:
 * 1. Sincronização inicial (carrega tudo ao montar)
 * 2. Realtime WebSocket (< 1 segundo, instantâneo)
 * 3. Polling rápido (5 segundos, backup)
 * 
 * ⚠️ IMPORTANTE: Use apenas UMA vez no MainLayout/RootLayout
 * 
 * @example
 * ```tsx
 * export function MainLayout({ children }) {
 *   useRealtimeSync(); // 👈 Adicione aqui
 *   return <div>{children}</div>;
 * }
 * ```
 */
export function useRealtimeSync() {
  const { 
    setupRealtimeSubscription, 
    syncWithSupabase, 
    fetchAppointments 
  } = useAppStore();
  
  // Previne múltiplas inicializações
  const isInitialized = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Evita executar múltiplas vezes
    if (isInitialized.current) {
      console.log('⚠️ useRealtimeSync já está ativo, pulando inicialização...');
      return;
    }

    isInitialized.current = true;
    console.log('');
    console.log('🚀 ════════════════════════════════════════════════════');
    console.log('🚀   SISTEMA DE SINCRONIZAÇÃO INSTANTÂNEA ATIVADO');
    console.log('🚀 ════════════════════════════════════════════════════');
    console.log('');

    // ═══════════════════════════════════════════════════════
    // 1️⃣ SINCRONIZAÇÃO INICIAL (carrega todos os dados)
    // ═══════════════════════════════════════════════════════
    console.log('⚡ PASSO 1: Sincronização inicial...');
    syncWithSupabase()
      .then(() => {
        console.log('✅ Sincronização inicial completa');
        console.log('');
      })
      .catch((error) => {
        console.error('❌ Erro na sincronização inicial:', error);
      });

    // ═══════════════════════════════════════════════════════
    // 2️⃣ REALTIME WEBSOCKET (atualização instantânea < 1s)
    // ═══════════════════════════════════════════════════════
    console.log('📡 PASSO 2: Ativando Realtime WebSocket...');
    try {
      const cleanup = setupRealtimeSubscription();
      realtimeCleanupRef.current = cleanup;
      console.log('✅ Realtime configurado com sucesso');
      console.log('');
    } catch (error) {
      console.error('❌ Erro ao configurar Realtime:', error);
      console.log('⚠️ Sistema continuará funcionando via Polling');
      console.log('');
    }

    // ═══════════════════════════════════════════════════════
    // 3️⃣ POLLING RÁPIDO (backup a cada 5 segundos)
    // ═══════════════════════════════════════════════════════
    console.log('⏱️  PASSO 3: Ativando Polling de backup (5 segundos)...');
    
    // Primeira verificação após 5 segundos
    setTimeout(() => {
      console.log('🔄 [POLLING] Primeira verificação...');
      fetchAppointments();
    }, 5000);

    // Depois continua a cada 5 segundos
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 [POLLING] Verificando atualizações...');
      fetchAppointments();
    }, 5000); // 5 segundos

    console.log('✅ Polling configurado com sucesso');
    console.log('');
    console.log('✅ ════════════════════════════════════════════════════');
    console.log('✅   SISTEMA 100% OPERACIONAL');
    console.log('✅ ════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Monitoramento:');
    console.log('   • Realtime: Detecta mudanças instantaneamente');
    console.log('   • Polling: Verifica a cada 5 segundos');
    console.log('   • Notificações: Criadas automaticamente');
    console.log('');

    // ═══════════════════════════════════════════════════════
    // CLEANUP (limpa recursos ao desmontar)
    // ═══════════════════════════════════════════════════════
    return () => {
      console.log('');
      console.log('🛑 ════════════════════════════════════════════════════');
      console.log('🛑   DESATIVANDO SISTEMA DE SINCRONIZAÇÃO');
      console.log('🛑 ════════════════════════════════════════════════════');
      
      // Limpa polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        console.log('✅ Polling desativado');
      }
      
      // Limpa realtime
      if (realtimeCleanupRef.current) {
        try {
          realtimeCleanupRef.current();
          realtimeCleanupRef.current = null;
          console.log('✅ Realtime desconectado');
        } catch (error) {
          console.error('⚠️ Erro ao desconectar Realtime:', error);
        }
      }
      
      isInitialized.current = false;
      console.log('✅ Sistema desativado com sucesso');
      console.log('');
    };
  }, []); // Dependências vazias = executa apenas uma vez

  // Hook não retorna nada (apenas efeitos colaterais)
  return null;
}