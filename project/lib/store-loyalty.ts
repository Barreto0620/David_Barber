// @ts-nocheck
// lib/store-loyalty.ts
// Extensão do store para funcionalidades de fidelidade

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { 
  LoyaltySettings, 
  LoyaltyPoints, 
  LoyaltyClient, 
  LoyaltyWheelSpin,
  LoyaltyHistory,
  LoyaltyStats 
} from '@/types/loyalty';

// ============================================
// NOVAS CONSTANTES (PRÊMIOS DA ROLETA)
// ============================================
const WHEEL_PRIZES = [
  { type: 'free_haircuts', value: 1, name: '1 Corte Grátis' },
  { type: 'points', value: 5, name: '5 Pontos Extras' },
  { type: 'points', value: 10, name: '10 Pontos Extras' },
  { type: 'nothing', value: 0, name: 'Tente na Próxima' },
  { type: 'free_haircuts', value: 2, name: '2 Cortes Grátis' },
];


export interface LoyaltyStore {
  // Estado
  loyaltySettings: LoyaltySettings | null;
  loyaltyClients: LoyaltyClient[];
  loyaltyHistory: LoyaltyHistory[];
  loyaltyStats: LoyaltyStats | null;
  loyaltyLoading: boolean;

  // Configurações
  fetchLoyaltySettings: () => Promise<void>;
  updateLoyaltySettings: (cutsForFree: number) => Promise<boolean>;
  initializeLoyaltySettings: () => Promise<void>;

  // Clientes e Pontos
  fetchLoyaltyClients: () => Promise<void>;
  addLoyaltyPoint: (clientId: string, appointmentId?: string) => Promise<boolean>;
  redeemFreeHaircut: (clientId: string, appointmentId?: string) => Promise<boolean>;
  adjustLoyaltyPoints: (clientId: string, pointsChange: number, reason: string) => Promise<boolean>;

  // Roleta
  // 🔥 Corrigido para receber o vencedor do frontend (page.tsx)
  spinWheel: (winnerClientId: string) => Promise<LoyaltyClient | null>; 
  fetchRecentWheelSpins: () => Promise<LoyaltyWheelSpin[]>;

  // Histórico
  fetchLoyaltyHistory: (clientId?: string) => Promise<void>;

  // Estatísticas
  calculateLoyaltyStats: () => void;

  // Realtime
  setupLoyaltyRealtime: () => () => void; 
}

const loyaltyStoreFunctions = (set: any, get: any) => ({
  loyaltySettings: null,
  loyaltyClients: [],
  loyaltyHistory: [],
  loyaltyStats: null,
  loyaltyLoading: false,

  // ============================================
  // CONFIGURAÇÕES DE FIDELIDADE
  // ============================================

  fetchLoyaltySettings: async () => {
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('professional_id', userAuth.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Se não existir, cria configuração padrão
        await get().initializeLoyaltySettings();
        return;
      }

      set({ loyaltySettings: data });
    } catch (error) {
      console.error('❌ Erro ao buscar configurações de fidelidade:', error);
    }
  },

  initializeLoyaltySettings: async () => {
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('loyalty_settings')
        .insert({
          professional_id: userAuth.user.id,
          cuts_for_free: 10,
          program_active: true
        })
        .select()
        .single();

      if (error) throw error;

      set({ loyaltySettings: data });
      console.log('✅ Configurações de fidelidade inicializadas');
    } catch (error) {
      console.error('❌ Erro ao inicializar configurações:', error);
    }
  },

  updateLoyaltySettings: async (cutsForFree: number) => {
    try {
      set({ loyaltyLoading: true });

      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('loyalty_settings')
        .update({ cuts_for_free: cutsForFree })
        .eq('professional_id', userAuth.user.id)
        .select()
        .single();

      if (error) throw error;

      set({ loyaltySettings: data });
      toast.success('Configurações de fidelidade atualizadas!');
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
  // CLIENTES E PONTOS
  // ============================================

  fetchLoyaltyClients: async () => {
    try {
      set({ loyaltyLoading: true });
      console.log('🔄 Buscando clientes de fidelidade...');

      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('loyalty_clients_view')
        .select('*')
        .eq('professional_id', userAuth.user.id)
        .order('points', { ascending: false });

      if (error) throw error;

      set({ 
        loyaltyClients: data || [],
        loyaltyLoading: false 
      });
      get().calculateLoyaltyStats();
      console.log(`✅ ${data?.length || 0} clientes de fidelidade carregados`);
    } catch (error) {
      console.error('❌ Erro ao buscar clientes de fidelidade:', error);
      set({ loyaltyLoading: false });
    }
  },

  addLoyaltyPoint: async (clientId: string, appointmentId?: string) => {
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) throw new Error('Não autenticado');

      const settings = get().loyaltySettings;
      if (!settings) {
        toast.error('Configure o programa de fidelidade primeiro');
        return false;
      }

      // Busca ou cria registro de pontos
      let { data: loyaltyPoints, error: fetchError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('client_id', clientId)
        .eq('professional_id', userAuth.user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      let newPoints = (loyaltyPoints?.points || 0) + 1;
      let newFreeHaircuts = loyaltyPoints?.free_haircuts || 0;
      let wonFreeHaircut = false;

      // Verifica se ganhou corte grátis
      if (newPoints >= settings.cuts_for_free) {
        newFreeHaircuts += 1;
        newPoints = 0;
        wonFreeHaircut = true;
      }

      if (!loyaltyPoints) {
        // Cria novo registro
        const { data: newRecord, error: insertError } = await supabase
          .from('loyalty_points')
          .insert({
            client_id: clientId,
            professional_id: userAuth.user.id,
            points: newPoints,
            free_haircuts: newFreeHaircuts,
            total_earned_points: 1
          })
          .select()
          .single();

        if (insertError) throw insertError;
        loyaltyPoints = newRecord;
      } else {
        // Atualiza registro existente
        const { error: updateError } = await supabase
          .from('loyalty_points')
          .update({
            points: newPoints,
            free_haircuts: newFreeHaircuts,
            total_earned_points: (loyaltyPoints.total_earned_points || 0) + 1
          })
          .eq('id', loyaltyPoints.id);

        if (updateError) throw updateError;
      }

      // Registra no histórico
      const { error: historyError } = await supabase
        .from('loyalty_history')
        .insert({
          loyalty_points_id: loyaltyPoints.id,
          client_id: clientId,
          professional_id: userAuth.user.id,
          action_type: wonFreeHaircut ? 'earned' : 'earned', // Ação é 'earned' nos dois casos, com 'free_haircuts_change' ajustado
          points_change: 1,
          free_haircuts_change: wonFreeHaircut ? 1 : 0,
          appointment_id: appointmentId,
          notes: wonFreeHaircut ? 'Ganhou 1 corte grátis!' : 'Adicionou 1 ponto'
        });

      if (historyError) console.error('Erro ao registrar histórico:', historyError);

      // Atualiza lista de clientes
      await get().fetchLoyaltyClients();

      if (wonFreeHaircut) {
        const client = get().loyaltyClients.find((c: LoyaltyClient) => c.client_id === clientId);
        // get().loyaltyClients é assíncrono. Para maior segurança, busque o nome no AppStore principal.
        const clientName = client?.name || get().clients.find(c => c.id === clientId)?.name || 'Cliente';
        toast.success(`🎉 ${clientName} ganhou um corte grátis!`);
      } else {
        toast.success('Ponto adicionado com sucesso!');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao adicionar ponto:', error);
      toast.error('Erro ao adicionar ponto');
      return false;
    }
  },

  redeemFreeHaircut: async (clientId: string, appointmentId?: string) => {
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) throw new Error('Não autenticado');

      const { data: loyaltyPoints, error: fetchError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('client_id', clientId)
        .eq('professional_id', userAuth.user.id)
        .single();

      if (fetchError) throw fetchError;

      if (!loyaltyPoints || loyaltyPoints.free_haircuts <= 0) {
        toast.error('Cliente não possui cortes grátis disponíveis');
        return false;
      }

      // Atualiza pontos
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({
          free_haircuts: loyaltyPoints.free_haircuts - 1,
          total_redeemed_haircuts: (loyaltyPoints.total_redeemed_haircuts || 0) + 1
        })
        .eq('id', loyaltyPoints.id);

      if (updateError) throw updateError;

      // Registra no histórico
      const { error: historyError } = await supabase
        .from('loyalty_history')
        .insert({
          loyalty_points_id: loyaltyPoints.id,
          client_id: clientId,
          professional_id: userAuth.user.id,
          action_type: 'redeemed',
          points_change: 0,
          free_haircuts_change: -1,
          appointment_id: appointmentId,
          notes: 'Resgatou 1 corte grátis'
        });

      if (historyError) console.error('Erro ao registrar histórico:', historyError);

      await get().fetchLoyaltyClients();
      toast.success('Corte grátis resgatado!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao resgatar corte grátis:', error);
      toast.error('Erro ao resgatar corte grátis');
      return false;
    }
  },

  adjustLoyaltyPoints: async (clientId: string, pointsChange: number, reason: string) => {
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) throw new Error('Não autenticado');

      const { data: loyaltyPoints, error: fetchError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('client_id', clientId)
        .eq('professional_id', userAuth.user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const currentPoints = loyaltyPoints?.points || 0;
      const newPoints = Math.max(0, currentPoints + pointsChange);

      if (!loyaltyPoints) {
        const { data: newRecord, error: insertError } = await supabase
          .from('loyalty_points')
          .insert({
            client_id: clientId,
            professional_id: userAuth.user.id,
            points: newPoints,
            free_haircuts: 0,
            total_earned_points: Math.max(0, pointsChange)
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await supabase.from('loyalty_history').insert({
          loyalty_points_id: newRecord.id,
          client_id: clientId,
          professional_id: userAuth.user.id,
          action_type: 'adjusted',
          points_change: pointsChange,
          free_haircuts_change: 0,
          notes: reason
        });
      } else {
        const { error: updateError } = await supabase
          .from('loyalty_points')
          .update({ points: newPoints })
          .eq('id', loyaltyPoints.id);

        if (updateError) throw updateError;

        await supabase.from('loyalty_history').insert({
          loyalty_points_id: loyaltyPoints.id,
          client_id: clientId,
          professional_id: userAuth.user.id,
          action_type: 'adjusted',
          points_change: pointsChange,
          free_haircuts_change: 0,
          notes: reason
        });
      }

      await get().fetchLoyaltyClients();
      toast.success('Pontos ajustados com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao ajustar pontos:', error);
      toast.error('Erro ao ajustar pontos');
      return false;
    }
  },

  // ============================================
  // ROLETA DA SORTE (CORRIGIDA)
  // ============================================

  spinWheel: async (winnerClientId: string) => { // 🔥 AGORA RECEBE O ID DO VENCEDOR DO FRONTEND
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) throw new Error('Não autenticado');

      const loyaltyClients = get().loyaltyClients;
      // Filtra a lista de elegíveis para o registro
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyClients = loyaltyClients.filter((client: LoyaltyClient) => {
        if (!client.last_visit) return false;
        const lastVisit = new Date(client.last_visit);
        return lastVisit >= weekAgo;
      });
      
      const winner = loyaltyClients.find((c) => c.client_id === winnerClientId); // Busca o vencedor real
      
      if (!winner) {
          toast.error('Vencedor da roleta não encontrado. Tente novamente.');
          return null;
      }
      
      // Definição do prêmio padrão (Sorteia o PRÊMIO, mantendo o VENCEDOR)
      const prizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
      const prize = WHEEL_PRIZES[prizeIndex];
      
      // Inicializa as mudanças no estado
      let updatedFields = {};
      let pointsChange = 0;
      let haircutsChange = 0;
      let historyNotes = `Sorteio: ${prize.name}`;

      // Busca ou cria registro de pontos do vencedor
      let { data: loyaltyPoints, error: fetchError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('client_id', winner.client_id)
        .eq('professional_id', userAuth.user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      // Define os valores atuais para atualização
      if (loyaltyPoints) {
          updatedFields = {
              points: loyaltyPoints.points,
              free_haircuts: loyaltyPoints.free_haircuts
          };
      }

      // 3. APLICA O PRÊMIO SORTEADO
      if (prize.type === 'free_haircuts') {
        haircutsChange = prize.value;
        updatedFields.free_haircuts = (loyaltyPoints?.free_haircuts || 0) + prize.value;

      } else if (prize.type === 'points') {
        pointsChange = prize.value;
        updatedFields.points = (loyaltyPoints?.points || 0) + prize.value;
      }
      // Se 'nothing', não muda nada (change = 0)

      if (!loyaltyPoints) {
        // Cria novo registro se não existir
        const { data: newRecord, error: insertError } = await supabase
          .from('loyalty_points')
          .insert({
            client_id: winner.client_id,
            professional_id: userAuth.user.id,
            points: updatedFields.points || 0,
            free_haircuts: updatedFields.free_haircuts || 0,
            total_earned_points: pointsChange // Conta os pontos adicionados
          })
          .select()
          .single();

        if (insertError) throw insertError;
        loyaltyPoints = newRecord;
      } else {
        // Atualiza registro existente
        const updatePayload = {
            points: updatedFields.points,
            free_haircuts: updatedFields.free_haircuts,
            total_earned_points: (loyaltyPoints.total_earned_points || 0) + Math.max(0, pointsChange)
        }
        
        const { error: updateError } = await supabase
          .from('loyalty_points')
          .update(updatePayload)
          .eq('id', loyaltyPoints.id);

        if (updateError) throw updateError;
      }

      // Registra o sorteio (wheel_spins)
      const weeklyClientsData = weeklyClients
          .map((c) => ({ id: c.client_id, name: c.name }));

      const { error: spinError } = await supabase
        .from('loyalty_wheel_spins')
        .insert({
          professional_id: userAuth.user.id,
          winner_client_id: winner.client_id,
          eligible_clients: weeklyClientsData, 
          prize_name: prize.name, // Adicionado para registrar o prêmio
          notes: `Sorteio: ${prize.name} com ${weeklyClients.length} participantes`
        });

      if (spinError) console.error('❌ Erro ao registrar sorteio:', spinError);

      // Registra no histórico (loyalty_history)
      await supabase.from('loyalty_history').insert({
        loyalty_points_id: loyaltyPoints.id,
        client_id: winner.client_id,
        professional_id: userAuth.user.id,
        action_type: 'wheel_won',
        points_change: pointsChange,
        free_haircuts_change: haircutsChange,
        notes: historyNotes
      });

      // Cria notificação
      get().addNotification({
        type: 'system',
        title: '🎉 Vencedor da Roleta da Sorte!',
        message: `${winner.name} ganhou: ${prize.name} no sorteio semanal!`,
        clientName: winner.name,
        serviceType: prize.name, // Usa o nome do prêmio como serviceType
        scheduledDate: new Date(),
      });

      await get().fetchLoyaltyClients();
      toast.success(`🎉 ${winner.name} ganhou: ${prize.name} na Roleta!`);

      // Retorna o vencedor (o frontend pode usar este objeto para exibir o resultado)
      return winner;
    } catch (error) {
      console.error('❌ Erro ao girar roleta:', error);
      toast.error('Erro ao realizar sorteio');
      return null;
    }
  },

  fetchRecentWheelSpins: async () => {
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('loyalty_wheel_spins')
        .select('*')
        .eq('professional_id', userAuth.user.id)
        .order('spin_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar histórico de sorteios:', error);
      return [];
    }
  },

  // ============================================
  // HISTÓRICO
  // ============================================

  fetchLoyaltyHistory: async (clientId?: string) => {
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) throw new Error('Não autenticado');

      let query = supabase
        .from('loyalty_history')
        .select('*')
        .eq('professional_id', userAuth.user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ loyaltyHistory: data || [] });
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
    }
  },

  // ============================================
  // ESTATÍSTICAS
  // ============================================

  calculateLoyaltyStats: () => {
    const clients = get().loyaltyClients;
    const settings = get().loyaltySettings;

    if (!clients || clients.length === 0) {
      set({
        loyaltyStats: {
          totalPoints: 0,
          totalFreeHaircuts: 0,
          clientsNearReward: 0,
          activeClients: 0,
          weeklyClients: 0
        }
      });
      return;
    }

    const totalPoints = clients.reduce((sum: number, c: LoyaltyClient) => sum + c.points, 0);
    const totalFreeHaircuts = clients.reduce((sum: number, c: LoyaltyClient) => sum + c.free_haircuts, 0);
    
    const cutsForFree = settings?.cuts_for_free || 10;
    const clientsNearReward = clients.filter(
      (c: LoyaltyClient) => c.points >= cutsForFree - 2 && c.points < cutsForFree
    ).length;

    const activeClients = clients.filter((c: LoyaltyClient) => c.total_visits > 0).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyClients = clients.filter((c: LoyaltyClient) => {
      if (!c.last_visit) return false;
      return new Date(c.last_visit) >= weekAgo;
    }).length;

    set({
      loyaltyStats: {
        totalPoints,
        totalFreeHaircuts,
        clientsNearReward,
        activeClients,
        weeklyClients
      }
    });
  },

  // ============================================
  // REALTIME
  // ============================================

  setupLoyaltyRealtime: () => {
    console.log('🔴 REALTIME: Fidelidade...');

    const channel = supabase
      .channel('loyalty-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loyalty_points' },
        async () => {
          console.log('🔄 Mudança em loyalty_points');
          await get().fetchLoyaltyClients();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loyalty_settings' },
        async () => {
          console.log('🔄 Mudança em loyalty_settings');
          await get().fetchLoyaltySettings();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ REALTIME FIDELIDADE CONECTADO');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },
});

// 🔥 CORREÇÃO ESSENCIAL: Mudar para Exportação Padrão (Default)
export default loyaltyStoreFunctions;