// @ts-nocheck
// lib/store-loyalty.ts - VERSÃO CORRIGIDA COM NOTIFICAÇÃO NO HEADER
'use client';

import { supabase } from '@/lib/supabase';
import type {
      LoyaltySettings,
      LoyaltyClient,
      LoyaltyHistory,
      LoyaltyStats,
      LoyaltyWheelSpin
} from '@/types/loyalty';
import { toast } from 'sonner';

export interface LoyaltyStore {
      loyaltySettings: LoyaltySettings | null;
      loyaltyClients: LoyaltyClient[];
      loyaltyHistory: LoyaltyHistory[];
      loyaltyStats: LoyaltyStats | null;
      loyaltyLoading: boolean;

      fetchLoyaltySettings: () => Promise<void>;
      updateLoyaltySettings: (cutsForFree: number) => Promise<boolean>;

      fetchLoyaltyClients: () => Promise<void>;
      addLoyaltyPoint: (clientId: string, appointmentId: string) => Promise<boolean>;
      redeemFreeHaircut: (clientId: string) => Promise<boolean>;

      fetchLoyaltyHistory: () => Promise<void>;

      calculateLoyaltyStats: () => void;

      spinWheel: (clientId: string) => Promise<LoyaltyClient | null>;

      setupLoyaltyRealtime: () => () => void;
}

const loyaltyStoreFunctions = (set: any, get: any) => ({
      // ============================================
      // FETCH LOYALTY SETTINGS
      // ============================================
      fetchLoyaltySettings: async () => {
            try {
                  console.log('🔄 fetchLoyaltySettings: Iniciando...');

                  const { data: userAuth } = await supabase.auth.getUser();
                  if (!userAuth?.user) {
                        console.warn('⚠️ fetchLoyaltySettings: Usuário não autenticado');
                        return;
                  }

                  const { data, error } = await supabase
                        .from('loyalty_settings')
                        .select('*')
                        .eq('professional_id', userAuth.user.id)
                        .maybeSingle();

                  if (error && error.code !== 'PGRST116') {
                        console.error('❌ Erro ao buscar configurações de fidelidade:', error);
                        throw error;
                  }

                  if (!data) {
                        console.log('📝 Criando configurações padrão de fidelidade...');

                        const defaultSettings = {
                              professional_id: userAuth.user.id,
                              cuts_for_free: 10,
                              active: true
                        };

                        const { data: newSettings, error: createError } = await supabase
                              .from('loyalty_settings')
                              .insert([defaultSettings])
                              .select()
                              .single();

                        if (createError) {
                              console.error('❌ Erro ao criar configurações:', createError);
                              throw createError;
                        }

                        console.log('✅ Configurações padrão criadas:', newSettings);
                        set({ loyaltySettings: newSettings });
                  } else {
                        console.log('✅ Configurações carregadas:', data);
                        set({ loyaltySettings: data });
                  }
            } catch (error) {
                  console.error('❌ Erro em fetchLoyaltySettings:', error);
            }
      },

      // ============================================
      // UPDATE LOYALTY SETTINGS
      // ============================================
      updateLoyaltySettings: async (cutsForFree: number) => {
            try {
                  set({ loyaltyLoading: true });
                  console.log('🔄 updateLoyaltySettings:', cutsForFree);

                  const { data: userAuth } = await supabase.auth.getUser();
                  if (!userAuth?.user) throw new Error('Não autenticado');

                  const { data, error } = await supabase
                        .from('loyalty_settings')
                        .update({ cuts_for_free: cutsForFree })
                        .eq('professional_id', userAuth.user.id)
                        .select()
                        .single();

                  if (error) throw error;

                  set({ loyaltySettings: data });
                  toast.success('Configurações atualizadas com sucesso!');

                  // Recalcular estatísticas
                  get().calculateLoyaltyStats?.();

                  return true;
            } catch (error) {
                  console.error('❌ Erro ao atualizar configurações:', error);
                  toast.error('Erro ao atualizar configurações');
                  return false;
            } finally {
                  set({ loyaltyLoading: false });
            }
      },

      // ============================================
      // FETCH LOYALTY CLIENTS - CORRIGIDO SEM VIEW
      // ============================================
      fetchLoyaltyClients: async () => {
            try {
                  set({ loyaltyLoading: true });
                  console.log('🔄 fetchLoyaltyClients: Iniciando...');

                  const { data: userAuth } = await supabase.auth.getUser();
                  if (!userAuth?.user) {
                        console.warn('⚠️ fetchLoyaltyClients: Usuário não autenticado');
                        set({ loyaltyLoading: false });
                        return;
                  }

                  // 🔥 BUSCAR TODOS OS CLIENTES COM VISITAS (SEM FILTRO DE PROFESSIONAL_ID)
                  const { data: clientsData, error: clientsError } = await supabase
                        .from('clients')
                        .select('*')
                        .gt('total_visits', 0)
                        .order('last_visit', { ascending: false });

                  if (clientsError) {
                        console.error('❌ Erro ao buscar clientes:', clientsError);
                        throw clientsError;
                  }

                  console.log(`✅ ${clientsData?.length || 0} clientes encontrados com visitas`);

                  if (!clientsData || clientsData.length === 0) {
                        console.log('⚠️ Nenhum cliente com visitas encontrado');
                        set({ loyaltyClients: [], loyaltyLoading: false });
                        get().calculateLoyaltyStats?.();
                        return;
                  }

                  const clientIds = clientsData.map(c => c.id);

                  // 🔥 BUSCAR DADOS DE FIDELIDADE (LOYALTY_POINTS)
                  const { data: loyaltyData, error: loyaltyError } = await supabase
                        .from('loyalty_points')
                        .select('*')
                        .in('client_id', clientIds);

                  if (loyaltyError && loyaltyError.code !== 'PGRST116') {
                        console.error('❌ Erro ao buscar dados de fidelidade:', loyaltyError);
                  }

                  console.log(`✅ ${loyaltyData?.length || 0} registros de fidelidade encontrados`);

                  // 🔥 COMBINAR DADOS
                  const loyaltyClients: LoyaltyClient[] = clientsData.map(client => {
                        const loyaltyRecord = loyaltyData?.find(l => l.client_id === client.id);

                        return {
                              client_id: client.id,
                              name: client.name,
                              phone: client.phone,
                              email: client.email || null,
                              points: loyaltyRecord?.points || 0,
                              free_haircuts: loyaltyRecord?.free_haircuts || 0,
                              total_visits: client.total_visits || 0,
                              total_spent: client.total_spent || 0,
                              last_visit: client.last_visit || null,
                              created_at: loyaltyRecord?.created_at || client.created_at,
                              updated_at: loyaltyRecord?.updated_at || new Date().toISOString()
                        };
                  });

                  console.log('✅ LoyaltyClients processados:', loyaltyClients.length);
                  if (loyaltyClients.length > 0) {
                        console.log('📊 Exemplo de cliente:', loyaltyClients[0]);
                  }

                  set({
                        loyaltyClients,
                        loyaltyLoading: false
                  });

                  // Recalcular estatísticas
                  get().calculateLoyaltyStats?.();

                  console.log('✅ fetchLoyaltyClients concluído!');
            } catch (error) {
                  console.error('❌ Erro em fetchLoyaltyClients:', error);
                  set({ loyaltyClients: [], loyaltyLoading: false });
            }
      },

      // ============================================
      // ADD LOYALTY POINT - CORRIGIDO
      // ============================================
      addLoyaltyPoint: async (clientId: string, appointmentId: string) => {
            try {
                  console.log('⭐ addLoyaltyPoint:', clientId);

                  const { data: userAuth } = await supabase.auth.getUser();
                  if (!userAuth?.user) throw new Error('Não autenticado');

                  const settings = get().loyaltySettings;
                  if (!settings) {
                        console.warn('⚠️ Configurações de fidelidade não encontradas');
                        return false;
                  }

                  const cutsForFree = settings.cuts_for_free;

                  // 🔥 BUSCAR DE loyalty_points (NÃO loyalty_clients)
                  const { data: existingLoyalty, error: fetchError } = await supabase
                        .from('loyalty_points')
                        .select('*')
                        .eq('client_id', clientId)
                        .eq('professional_id', userAuth.user.id)
                        .maybeSingle();

                  if (fetchError && fetchError.code !== 'PGRST116') {
                        console.error('❌ Erro ao buscar fidelidade:', fetchError);
                        throw fetchError;
                  }

                  let newPoints = 0;
                  let newFreeHaircuts = 0;

                  if (existingLoyalty) {
                        // Atualizar pontos existentes
                        newPoints = (existingLoyalty.points || 0) + 1;
                        newFreeHaircuts = existingLoyalty.free_haircuts || 0;

                        // Verificar se ganhou corte grátis
                        if (newPoints >= cutsForFree) {
                              newFreeHaircuts += 1;
                              newPoints = 0; // Resetar pontos

                              toast.success('🎉 Cliente ganhou 1 corte grátis!', {
                                    description: `Completou ${cutsForFree} visitas!`,
                                    duration: 5000
                              });
                        }

                        const { error: updateError } = await supabase
                              .from('loyalty_points')
                              .update({
                                    points: newPoints,
                                    free_haircuts: newFreeHaircuts,
                                    total_earned_points: (existingLoyalty.total_earned_points || 0) + 1,
                                    updated_at: new Date().toISOString()
                              })
                              .eq('client_id', clientId)
                              .eq('professional_id', userAuth.user.id);

                        if (updateError) throw updateError;

                  } else {
                        // Criar novo registro
                        newPoints = 1;
                        newFreeHaircuts = 0;

                        const { error: insertError } = await supabase
                              .from('loyalty_points')
                              .insert([{
                                    client_id: clientId,
                                    professional_id: userAuth.user.id,
                                    points: newPoints,
                                    free_haircuts: newFreeHaircuts,
                                    total_earned_points: 1,
                                    total_redeemed_haircuts: 0
                              }]);

                        if (insertError) throw insertError;
                  }

                  // Registrar no histórico
                  await supabase
                        .from('loyalty_history')
                        .insert([{
                              client_id: clientId,
                              professional_id: userAuth.user.id,
                              appointment_id: appointmentId,
                              action_type: 'earned',
                              points_change: 1,
                              free_haircuts_change: newFreeHaircuts > (existingLoyalty?.free_haircuts || 0) ? 1 : 0,
                              notes: newFreeHaircuts > (existingLoyalty?.free_haircuts || 0) ? 'Ganhou 1 corte grátis!' : 'Adicionou 1 ponto'
                        }]);

                  console.log('✅ Ponto de fidelidade adicionado!');

                  // Recarregar dados
                  await get().fetchLoyaltyClients?.();

                  return true;
            } catch (error) {
                  console.error('❌ Erro ao adicionar ponto:', error);
                  return false;
            }
      },

      // ============================================
      // REDEEM FREE HAIRCUT - CORRIGIDO
      // ============================================
      redeemFreeHaircut: async (clientId: string) => {
            try {
                  set({ loyaltyLoading: true });
                  console.log('🎁 redeemFreeHaircut:', clientId);

                  const { data: userAuth } = await supabase.auth.getUser();
                  if (!userAuth?.user) throw new Error('Não autenticado');

                  // 🔥 BUSCAR DE loyalty_points (NÃO loyalty_clients)
                  const { data: loyalty, error: fetchError } = await supabase
                        .from('loyalty_points')
                        .select('*')
                        .eq('client_id', clientId)
                        .eq('professional_id', userAuth.user.id)
                        .single();

                  if (fetchError) throw fetchError;

                  if (!loyalty || loyalty.free_haircuts <= 0) {
                        toast.error('Cliente não possui cortes grátis disponíveis!');
                        return false;
                  }

                  // Decrementar corte grátis e ZERAR pontos
                  const { error: updateError } = await supabase
                        .from('loyalty_points')
                        .update({
                              free_haircuts: loyalty.free_haircuts - 1,
                              points: 0,
                              total_redeemed_haircuts: (loyalty.total_redeemed_haircuts || 0) + 1,
                              updated_at: new Date().toISOString()
                        })
                        .eq('client_id', clientId)
                        .eq('professional_id', userAuth.user.id);

                  if (updateError) throw updateError;

                  // Registrar no histórico
                  await supabase
                        .from('loyalty_history')
                        .insert([{
                              client_id: clientId,
                              professional_id: userAuth.user.id,
                              action_type: 'redeemed',
                              points_change: 0,
                              free_haircuts_change: -1,
                              notes: 'Corte grátis resgatado (Pontos zerados)'
                        }]);

                  toast.success('✅ Corte grátis resgatado com sucesso!');

                  // Recarregar dados
                  await get().fetchLoyaltyClients?.();

                  return true;
            } catch (error) {
                  console.error('❌ Erro ao resgatar corte grátis:', error);
                  toast.error('Erro ao resgatar corte grátis');
                  return false;
            } finally {
                  set({ loyaltyLoading: false });
            }
      },

      // ============================================
      // FETCH LOYALTY HISTORY
      // ============================================
      fetchLoyaltyHistory: async () => {
            try {
                  const { data: userAuth } = await supabase.auth.getUser();
                  if (!userAuth?.user) return;

                  const { data, error } = await supabase
                        .from('loyalty_history')
                        .select('*')
                        .eq('professional_id', userAuth.user.id)
                        .order('created_at', { ascending: false })
                        .limit(50);

                  if (error) throw error;

                  set({ loyaltyHistory: data || [] });
            } catch (error) {
                  console.error('❌ Erro ao buscar histórico:', error);
            }
      },

      // ============================================
      // CALCULATE LOYALTY STATS
      // ============================================
      calculateLoyaltyStats: () => {
            const clients = get().loyaltyClients || [];
            const settings = get().loyaltySettings;

            if (!settings) return;

            const cutsForFree = settings.cuts_for_free;

            const stats: LoyaltyStats = {
                  totalPoints: clients.reduce((sum, c) => sum + (c.points || 0), 0),
                  totalFreeHaircuts: clients.reduce((sum, c) => sum + (c.free_haircuts || 0), 0),
                  clientsNearReward: clients.filter(c => c.points >= cutsForFree - 2).length,
                  totalClients: clients.length
            };

            console.log('📊 Estatísticas de fidelidade:', stats);
            set({ loyaltyStats: stats });
      },

      // ============================================
      // SPIN WHEEL - CORRIGIDO COM NOTIFICAÇÃO NO HEADER
      // ============================================
      spinWheel: async (clientId: string) => {
            try {
                  set({ loyaltyLoading: true });
                  console.log('🎰 spinWheel: Iniciando sorteio para:', clientId);

                  const { data: userAuth } = await supabase.auth.getUser();
                  if (!userAuth?.user) throw new Error('Não autenticado');

                  // 🔥 BUSCAR DADOS DO CLIENTE ANTES DE ATUALIZAR
                  const { data: clientData, error: clientError } = await supabase
                        .from('clients')
                        .select('name, phone')
                        .eq('id', clientId)
                        .single();

                  if (clientError) {
                        console.error('❌ Erro ao buscar dados do cliente:', clientError);
                        throw clientError;
                  }

                  console.log('✅ Cliente encontrado:', clientData.name);

                  // 🔥 BUSCAR DADOS DE FIDELIDADE
                  const { data: existingLoyalty, error: fetchError } = await supabase
                        .from('loyalty_points')
                        .select('*')
                        .eq('client_id', clientId)
                        .eq('professional_id', userAuth.user.id)
                        .maybeSingle();

                  if (fetchError && fetchError.code !== 'PGRST116') {
                        console.error('❌ Erro ao buscar fidelidade:', fetchError);
                        throw fetchError;
                  }

                  let newFreeHaircuts = 0;

                  if (existingLoyalty) {
                        newFreeHaircuts = (existingLoyalty.free_haircuts || 0) + 1;

                        console.log(`🎁 Atualizando fidelidade: ${existingLoyalty.free_haircuts} → ${newFreeHaircuts}`);

                        const { error: updateError } = await supabase
                              .from('loyalty_points')
                              .update({
                                    free_haircuts: newFreeHaircuts,
                                    updated_at: new Date().toISOString()
                              })
                              .eq('client_id', clientId)
                              .eq('professional_id', userAuth.user.id);

                        if (updateError) {
                              console.error('❌ Erro ao atualizar fidelidade:', updateError);
                              throw updateError;
                        }

                  } else {
                        newFreeHaircuts = 1;

                        console.log('📝 Criando novo registro de fidelidade');

                        const { error: insertError } = await supabase
                              .from('loyalty_points')
                              .insert([{
                                    client_id: clientId,
                                    professional_id: userAuth.user.id,
                                    points: 0,
                                    free_haircuts: newFreeHaircuts,
                                    total_earned_points: 0,
                                    total_redeemed_haircuts: 0
                              }]);

                        if (insertError) {
                              console.error('❌ Erro ao criar fidelidade:', insertError);
                              throw insertError;
                        }
                  }

                  // 🔥 REGISTRAR NO HISTÓRICO
                  const { error: historyError } = await supabase
                        .from('loyalty_history')
                        .insert([{
                              client_id: clientId,
                              professional_id: userAuth.user.id,
                              action_type: 'wheel_won',
                              points_change: 0,
                              free_haircuts_change: 1,
                              notes: `🎰 Ganhou 1 corte grátis na roleta da sorte!`
                        }]);

                  if (historyError) {
                        console.error('⚠️ Erro ao registrar histórico:', historyError);
                  }

                  console.log('✅ Sorteio concluído com sucesso!');

                  // 🔥 ADICIONAR NOTIFICAÇÃO NO HEADER (SINO)
                  const addNotification = get().addNotification;
                  if (addNotification) {
                        addNotification({
                              type: 'loyalty',
                              title: '🎉 Ganhador da Roleta da Sorte!',
                              message: `Parabéns! ${clientData.name} foi o sortudo(a) e ganhou 1 corte grátis na roleta!`,
                              clientName: clientData.name,
                              read: false,
                        });
                        console.log('✅ Notificação adicionada no header!');
                  }

                  // 🔥 TOAST RÁPIDO (OPCIONAL)
                  toast.success('🎰 Sorteio realizado!', {
                        description: `${clientData.name} ganhou!`,
                        duration: 3000,
                  });

                  // 🔥 RECARREGAR DADOS DOS CLIENTES
                  console.log('🔄 Recarregando lista de clientes...');
                  await get().fetchLoyaltyClients?.();

                  // 🔥 RETORNAR CLIENTE ATUALIZADO
                  const updatedClient = get().loyaltyClients.find((c: LoyaltyClient) => c.client_id === clientId);

                  if (updatedClient) {
                        console.log('✅ Cliente atualizado retornado:', updatedClient);
                        return updatedClient;
                  } else {
                        console.warn('⚠️ Cliente não encontrado na lista atualizada');
                        return {
                              client_id: clientId,
                              name: clientData.name,
                              phone: clientData.phone,
                              email: null,
                              points: 0,
                              free_haircuts: newFreeHaircuts,
                              total_visits: 0,
                              total_spent: 0,
                              last_visit: null,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString()
                        } as LoyaltyClient;
                  }

            } catch (error) {
                  console.error('❌ Erro no sorteio da roleta:', error);
                  toast.error('Erro ao realizar sorteio', {
                        description: 'Não foi possível processar o sorteio. Tente novamente.',
                        duration: 4000
                  });
                  return null;
            } finally {
                  set({ loyaltyLoading: false });
            }
      },

      // ============================================
      // SETUP REALTIME
      // ============================================
      setupLoyaltyRealtime: () => {
            const channel = supabase
                  .channel('loyalty-realtime')
                  .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'loyalty_points' },
                        async () => {
                              console.log('🔄 Atualização em loyalty_points detectada');
                              await get().fetchLoyaltyClients?.();
                        }
                  )
                  .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'loyalty_settings' },
                        async () => {
                              console.log('🔄 Atualização em loyalty_settings detectada');
                              await get().fetchLoyaltySettings?.();
                        }
                  )
                  .subscribe();

            return () => {
                  console.log('🔴 Desconectando loyalty realtime');
                  supabase.removeChannel(channel);
            };
      },
});

export default loyaltyStoreFunctions;