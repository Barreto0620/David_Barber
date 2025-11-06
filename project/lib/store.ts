// @ts-nocheck
// lib/store.ts - VERSÃO CORRIGIDA COMPLETA
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Client, Appointment, Service, DashboardMetrics, MonthlyClient, MonthlySchedule, MonthlyClientWithDetails } from '@/types/database';
import type { Notification, NotificationType } from '@/types/notifications';
import { getAppointmentsByDate, getAppointmentsByStatus } from '@/lib/utils/appointments';
import { toast } from 'sonner';

// ============================================
// 🔥 IMPORTS DE FIDELIDADE
// ============================================
import type { 
  LoyaltySettings, 
  LoyaltyClient, 
  LoyaltyHistory,
  LoyaltyStats,
  LoyaltyWheelSpin
} from '@/types/loyalty'; 

import loyaltyStoreFunctions, { LoyaltyStore } from './store-loyalty'; 

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

const generateMonthlyAppointments = (
  schedules: Array<{ dayOfWeek: number; time: string; serviceType: string }>,
  clientId: string,
  startDate: string,
  monthlyPrice: number
): Array<Omit<Appointment, 'id' | 'created_at' | 'professional_id'>> => {
  const appointments: Array<Omit<Appointment, 'id' | 'created_at' | 'professional_id'>> = [];
  const start = new Date(startDate);
  const currentMonth = start.getMonth();
  const currentYear = start.getFullYear();
  
  const totalSchedulesPerMonth = schedules.length * 4;
  const pricePerVisit = totalSchedulesPerMonth > 0 ? monthlyPrice / totalSchedulesPerMonth : monthlyPrice;

  schedules.forEach(schedule => {
    const date = new Date(currentYear, currentMonth, 1);
    
    while (date.getDay() !== schedule.dayOfWeek) {
      date.setDate(date.getDate() + 1);
    }

    while (date.getMonth() === currentMonth) {
      const [hours, minutes] = schedule.time.split(':');
      const scheduledDate = new Date(date);
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (scheduledDate >= start) {
        appointments.push({
          client_id: clientId,
          scheduled_date: scheduledDate.toISOString(),
          service_type: schedule.serviceType,
          status: 'scheduled',
          price: pricePerVisit,
          payment_method: null,
          created_via: 'manual',
          notes: '🔄 Agendamento Recorrente - Cliente Mensal'
        });
      }

      date.setDate(date.getDate() + 7);
    }
  });

  return appointments.sort((a, b) => 
    new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  );
};

const getWeeklyRevenue = (appointments: Appointment[]): number => {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  return appointments
    .filter(a => a.status === 'completed' && new Date(a.scheduled_date) >= weekStart)
    .reduce((sum, a) => sum + (Number(a.price) || 0), 0);
};

const getMonthlyRevenue = (appointments: Appointment[]): number => {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return appointments
    .filter(a => a.status === 'completed' && new Date(a.scheduled_date) >= monthStart)
    .reduce((sum, a) => sum + (Number(a.price) || 0), 0);
};

// ============================================
// INTERFACE PRINCIPAL DO STORE
// ============================================

interface AppStore extends LoyaltyStore { 
  clients: Client[];
  appointments: Appointment[];
  services: Service[];
  metrics: DashboardMetrics;
  selectedDate: Date;
  isLoading: boolean;
  lastSync: string | null;
  notifications: Notification[];
  unreadCount: number;
  monthlyClients: MonthlyClientWithDetails[];
  monthlyClientsLoading: boolean;

  setClients: (clients: Client[]) => void;
  setAppointments: (appointments: Appointment[]) => void;
  setServices: (services: Service[]) => void;
  setMetrics: (metrics: DashboardMetrics) => void;
  setSelectedDate: (date: Date) => void;
  setLoading: (loading: boolean) => void;
  
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'professional_id'>) => Promise<Client | null>;
  updateClient: (id: string, client: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
  
  addAppointment: (appointment: Omit<Appointment, 'id' | 'created_at' | 'professional_id'>) => Promise<Appointment | null>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
  completeAppointment: (id: string, paymentMethod: string, finalPrice?: number) => Promise<boolean>;
  cancelAppointment: (id: string) => Promise<boolean>;
  
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  syncWithSupabase: () => Promise<void>;
  fetchClients: () => Promise<void>;
  fetchAppointments: () => Promise<void>;
  fetchServices: () => Promise<void>;
  setupRealtimeSubscription: () => () => void; 
  
  getTodaysAppointments: () => Appointment[];
  getClientById: (id: string) => Client | undefined;
  getRecentClients: () => Client[];
  calculateMetrics: () => void;

  fetchMonthlyClients: () => Promise<void>;
  addMonthlyClient: (data: {
    clientId: string;
    planType: 'basic' | 'premium' | 'vip';
    monthlyPrice: number;
    startDate: string;
    schedules: Array<{
      dayOfWeek: number;
      time: string;
      serviceType: string;
    }>;
    notes?: string;
  }) => Promise<MonthlyClient | null>;
  updateMonthlyClient: (id: string, data: Partial<MonthlyClient>) => Promise<boolean>;
  updateMonthlySchedules: (monthlyClientId: string, schedules: Array<{
    dayOfWeek: number;
    time: string;
    serviceType: string;
  }>) => Promise<boolean>;
  deleteMonthlyClient: (id: string) => Promise<boolean>;
  suspendMonthlyClient: (id: string) => Promise<boolean>;
  reactivateMonthlyClient: (id: string) => Promise<boolean>;
  markMonthlyPaymentAsPaid: (id: string) => Promise<boolean>;
  convertToMonthlyClient: (data: {
    clientId: string;
    planType: 'basic' | 'premium' | 'vip';
    monthlyPrice: number;
    startDate: string;
    schedules: Array<{
      dayOfWeek: number;
      time: string;
      serviceType: string;
    }>;
    notes?: string;
  }) => Promise<MonthlyClient | null>;
  convertToNormalClient: (monthlyClientId: string) => Promise<boolean>;
  getMonthlyClientByClientId: (clientId: string) => MonthlyClientWithDetails | undefined;
  isClientMonthly: (clientId: string) => boolean;
  setupMonthlyClientsRealtime: () => () => void;
  renewMonthlyAppointments: (monthlyClientId: string) => Promise<boolean>;
}

// ============================================
// IMPLEMENTAÇÃO DO STORE
// ============================================

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ESTADO PRINCIPAL
      clients: [],
      appointments: [],
      services: [
        { id: '1', name: 'Corte Simples', price: 25, duration_minutes: 30, active: true, description: null, created_at: new Date().toISOString() },
        { id: '2', name: 'Corte + Barba', price: 35, duration_minutes: 45, active: true, description: null, created_at: new Date().toISOString() },
        { id: '3', name: 'Barba', price: 15, duration_minutes: 20, active: true, description: null, created_at: new Date().toISOString() },
        { id: '4', name: 'Corte Especial', price: 40, duration_minutes: 60, active: true, description: null, created_at: new Date().toISOString() },
      ],
      metrics: {
        todayRevenue: 0,
        todayAppointments: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        completedToday: 0,
        scheduledToday: 0,
      },
      selectedDate: new Date(),
      isLoading: false,
      lastSync: null,
      notifications: [],
      unreadCount: 0,
      monthlyClients: [],
      monthlyClientsLoading: false,

      // 🔥 ESTADO DE FIDELIDADE
      loyaltySettings: null,
      loyaltyClients: [],
      loyaltyHistory: [],
      loyaltyStats: null,
      loyaltyLoading: false,

      // ============================================
      // FUNÇÕES BÁSICAS
      // ============================================
      setClients: (clients) => { set({ clients }); get().calculateMetrics(); get().calculateLoyaltyStats?.(); }, 
      setAppointments: (appointments) => { set({ appointments }); get().calculateMetrics(); },
      setServices: (services) => set({ services }),
      setMetrics: (metrics) => set({ metrics }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setLoading: (isLoading) => set({ isLoading }),

      // ============================================
      // NOTIFICAÇÕES
      // ============================================
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          read: false,
          createdAt: new Date(),
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (!notification || notification.read) return state;
          
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notif = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notif && !notif.read ? state.unreadCount - 1 : state.unreadCount,
          };
        });
      },

      clearAllNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      // ============================================
      // 🔥 REALTIME PRINCIPAL
      // ============================================
      setupRealtimeSubscription: () => {
        console.log('🔴 REALTIME: Iniciando listener completo (TODOS OS PROFISSIONAIS)...');

        const appointmentChannel = supabase
          .channel('appointments-realtime-all')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'appointments',
            },
            async (payload) => {
              console.log('🆕 INSERT DETECTADO (qualquer profissional):', payload.new);

              const newAppointment = payload.new as Appointment;

              const { data: userAuth } = await supabase.auth.getUser();
              if (!userAuth?.user) {
                console.warn('⚠️ Usuário não autenticado no realtime');
                return;
              }

              const currentUserId = userAuth.user.id;

              // Se não tem professional_id, vincular ao usuário atual
              if (!newAppointment.professional_id) {
                console.log('🌐 AGENDAMENTO DA LANDING PAGE DETECTADO!');
                
                const { error: updateError } = await supabase
                  .from('appointments')
                  .update({ professional_id: currentUserId })
                  .eq('id', newAppointment.id);

                if (updateError) {
                  console.error('❌ Erro ao vincular agendamento:', updateError);
                } else {
                  newAppointment.professional_id = currentUserId;
                  console.log('✅ Agendamento vinculado ao profissional:', currentUserId);
                }
              }

              // 🔥 MUDANÇA: ACEITAR AGENDAMENTOS DE TODOS OS PROFISSIONAIS
              console.log('✅ Adicionando agendamento (profissional:', newAppointment.professional_id, ')');

              if (newAppointment.client_id) {
                const { data: clientData } = await supabase
                  .from('clients')
                  .select('id, name, phone, email')
                  .eq('id', newAppointment.client_id)
                  .maybeSingle();
                
                if (clientData) {
                  newAppointment.client = clientData;
                  console.log('👤 Cliente carregado:', clientData.name);
                }
              }

              set((state) => ({
                appointments: [newAppointment, ...state.appointments],
                lastSync: new Date().toISOString(),
              }));

              console.log('✅ AGENDAMENTO ADICIONADO EM TEMPO REAL!');

              get().calculateMetrics();

              // Só notifica se for do profissional atual
              if (newAppointment.professional_id === currentUserId) {
                const clientName = newAppointment.client?.name || 'Cliente';
                
                get().addNotification({
                  type: 'appointment',
                  title: newAppointment.created_via === 'manual' ? '✅ Agendamento Criado' : '🌐 Novo Agendamento Online',
                  message: `${clientName} - ${newAppointment.service_type}`,
                  appointmentId: newAppointment.id,
                  clientName,
                  serviceType: newAppointment.service_type,
                  scheduledDate: new Date(newAppointment.scheduled_date),
                });

                toast.success(`🌐 Novo agendamento online de ${clientName}!`, {
                  description: `${newAppointment.service_type} - ${new Date(newAppointment.scheduled_date).toLocaleString('pt-BR')}`,
                  duration: 5000,
                });

                console.log('🔔 Notificação criada para:', clientName);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'appointments',
            },
            async (payload) => {
              console.log('🔄 UPDATE DETECTADO (qualquer profissional):', payload.new);

              const updatedAppointment = payload.new as Appointment;

              if (updatedAppointment.client_id) {
                const { data: clientData } = await supabase
                  .from('clients')
                  .select('id, name, phone, email')
                  .eq('id', updatedAppointment.client_id)
                  .maybeSingle();
                
                if (clientData) {
                  updatedAppointment.client = clientData;
                }
              }

              set((state) => ({
                appointments: state.appointments.map((apt) =>
                  apt.id === updatedAppointment.id ? updatedAppointment : apt
                ),
                lastSync: new Date().toISOString(),
              }));

              get().calculateMetrics();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'appointments',
            },
            (payload) => {
              console.log('🗑️ DELETE DETECTADO (qualquer profissional):', payload.old);

              const deletedId = (payload.old as any).id;

              set((state) => ({
                appointments: state.appointments.filter((apt) => apt.id !== deletedId),
                lastSync: new Date().toISOString(),
              }));

              get().calculateMetrics();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ REALTIME APPOINTMENTS CONECTADO (TODOS OS PROFISSIONAIS)');
            } else if (status === 'CLOSED') {
              console.warn('⚠️ Realtime desconectado, tentando reconectar...');
            } else {
              console.log('📡 Status Realtime:', status);
            }
          });

        const monthlyChannelUnsub = get().setupMonthlyClientsRealtime(); 
        const loyaltyChannelUnsub = get().setupLoyaltyRealtime?.() || (() => {}); 

        return () => {
          console.log('🔴 REALTIME: Desconectando...');
          supabase.removeChannel(appointmentChannel);
          monthlyChannelUnsub();
          loyaltyChannelUnsub();
        };
      },

      // ============================================
      // 🔥 FETCH APPOINTMENTS - TODOS OS PROFISSIONAIS
      // ============================================
      fetchAppointments: async () => {
        try {
          console.log('🔄 ========================================');
          console.log('🔄 Buscando TODOS os agendamentos (todos profissionais)...');
          console.log('🔄 ========================================');
          
          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth?.user) {
            console.warn('⚠️ fetchAppointments: Usuário não autenticado');
            return;
          }

          const currentUserId = userAuth.user.id;
          const currentIds = new Set(get().appointments.map(a => a.id));

          // 🔥 MUDANÇA PRINCIPAL: REMOVER O FILTRO .eq('professional_id', currentUserId)
          // Agora busca TODOS os agendamentos, independente do profissional
          const { data: appointmentsData, error: fetchError } = await supabase
            .from('appointments')
            .select(`
              *,
              client:clients!client_id (
                id,
                name,
                phone,
                email
              )
            `)
            .order('scheduled_date', { ascending: false });
          
          if (fetchError) throw fetchError;

          console.log(`✅ ${appointmentsData?.length || 0} agendamentos encontrados (TODOS os profissionais)`);

          const fetchedAppointments = appointmentsData || [];

          // Vincular agendamentos órfãos (sem professional_id) ao usuário atual
          const orphanAppointments = fetchedAppointments.filter(apt => !apt.professional_id);
          
          if (orphanAppointments.length > 0) {
            console.log(`🔧 ${orphanAppointments.length} agendamentos órfãos encontrados. Vinculando ao profissional atual...`);
            
            const idsToUpdate = orphanAppointments.map(apt => apt.id);
            
            const { error: updateError } = await supabase
              .from('appointments')
              .update({ professional_id: currentUserId })
              .in('id', idsToUpdate);

            if (!updateError) {
              orphanAppointments.forEach(apt => {
                apt.professional_id = currentUserId;
              });
              console.log('✅ Agendamentos órfãos vinculados com sucesso!');
            } else {
              console.error('❌ Erro ao vincular agendamentos órfãos:', updateError);
            }
          }

          // Detectar novos agendamentos para notificações
          const newAppointments = fetchedAppointments.filter(apt => !currentIds.has(apt.id));

          if (newAppointments.length > 0) {
            console.log(`🆕 ${newAppointments.length} novos agendamentos detectados`);
            
            for (const apt of newAppointments) {
              const isRecent = new Date(apt.created_at).getTime() > (Date.now() - 10000);
              
              // Só notifica se for agendamento recente E do profissional atual
              if (isRecent && apt.professional_id === currentUserId) {
                const clientName = apt.client?.name || 'Cliente';

                get().addNotification({
                  type: 'appointment',
                  title: apt.created_via === 'manual' ? '✅ Agendamento Criado' : '🌐 Novo Agendamento Online',
                  message: `${clientName} - ${apt.service_type}`,
                  appointmentId: apt.id,
                  clientName,
                  serviceType: apt.service_type,
                  scheduledDate: new Date(apt.scheduled_date),
                });

                if (apt.created_via !== 'manual') {
                  toast.success(`🌐 Novo agendamento online de ${clientName}!`, {
                    description: `${apt.service_type} - ${new Date(apt.scheduled_date).toLocaleString('pt-BR')}`,
                    duration: 5000,
                  });
                }
              }
            }
          }

          set({ 
            appointments: fetchedAppointments,
            lastSync: new Date().toISOString() 
          });

          get().calculateMetrics();
          
          console.log('✅ ========================================');
          console.log(`✅ fetchAppointments concluído! Total: ${fetchedAppointments.length}`);
          console.log('✅ ========================================\n');
        } catch (error) {
          console.error('❌ Erro em fetchAppointments:', error);
        }
      },

      // ============================================
      // SYNC PRINCIPAL
      // ============================================
      syncWithSupabase: async () => {
        try {
          console.log('🔄 Iniciando sincronização completa...');
          await Promise.all([
            get().fetchClients(),
            get().fetchAppointments(),
            get().fetchServices(),
            get().fetchMonthlyClients(),
            get().fetchLoyaltySettings?.() || Promise.resolve(), 
            get().fetchLoyaltyClients?.() || Promise.resolve(), 
          ]);
          console.log('✅ Sincronização completa finalizada');
        } catch (error) {
          console.error('❌ Erro na sincronização:', error);
        }
      },

      // ============================================
      // CLIENTS
      // ============================================

      addClient: async (clientData) => {
        try {
          set({ isLoading: true });

          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) throw new Error('Não autenticado');

          const cleanEmail = clientData.email?.trim();
          const finalEmail = cleanEmail && cleanEmail.length > 0 ? cleanEmail : null;

          const payload = {
            name: clientData.name?.trim(),
            phone: clientData.phone?.trim(),
            email: finalEmail,
            notes: clientData.notes?.trim() || null,
            total_visits: clientData.total_visits ?? 0,
            total_spent: clientData.total_spent ?? 0,
            preferences: clientData.preferences ?? null,
            last_visit: clientData.last_visit ?? null,
            professional_id: userAuth.user.id,
          };

          const { data, error } = await supabase
            .from('clients')
            .insert([payload])
            .select('*')
            .single();

          if (error) throw error;

          const newClient = data as Client;
          set(state => ({ 
            clients: [newClient, ...state.clients],
            lastSync: new Date().toISOString() 
          }));
          
          get().calculateMetrics();
          return newClient;
        } catch (error) {
          console.error('Erro ao adicionar cliente:', error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updateClient: async (id, clientData) => {
        try {
          set({ isLoading: true });
          const { id: _, created_at: __, ...updateData } = clientData as any;

          const { data, error } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();
          
          if (error) throw error;

          set(state => ({ 
            clients: state.clients.map(c => c.id === id ? { ...c, ...data } : c),
            lastSync: new Date().toISOString() 
          }));
          
          get().calculateMetrics();
          get().fetchLoyaltyClients?.(); 
          return true;
        } catch (error) {
          console.error('Erro ao atualizar cliente:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteClient: async (id) => {
        try {
          set({ isLoading: true });

          const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set(state => ({
            clients: state.clients.filter(c => c.id !== id),
            appointments: state.appointments.filter(a => a.client_id !== id),
            lastSync: new Date().toISOString()
          }));
          
          get().calculateMetrics();
          get().fetchLoyaltyClients?.(); 
          return true;
        } catch (error) {
          console.error('Erro ao excluir cliente:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
      
      fetchClients: async () => {
        try {
          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) {
            console.warn('⚠️ fetchClients: Usuário não autenticado.');
            return;
          }
          
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('professional_id', userAuth.user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          set({ 
            clients: data || [],
            lastSync: new Date().toISOString() 
          });
          
          get().calculateMetrics();
        } catch (error) {
          console.error('❌ Erro ao buscar clientes:', error);
        }
      },

      // ============================================
      // APPOINTMENTS
      // ============================================

      addAppointment: async (appointmentData) => {
        try {
          set({ isLoading: true });

          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) throw new Error('Não autenticado');

          const cleanData = {
            client_id: appointmentData.client_id ?? null,
            scheduled_date: appointmentData.scheduled_date,
            service_type: appointmentData.service_type,
            status: appointmentData.status || 'scheduled',
            price: appointmentData.price ?? 0,
            payment_method: appointmentData.payment_method ?? null,
            created_via: appointmentData.created_via ?? 'manual',
            notes: appointmentData.notes ?? null,
            professional_id: userAuth.user.id,
          };

          const { data, error } = await supabase
            .from('appointments')
            .insert([cleanData])
            .select(`
              *,
              client:clients!client_id (
                id,
                name,
                phone,
                email
              )
            `)
            .single();

          if (error) throw error;

          const newAppointment = data as Appointment;
          
          set(state => ({ 
            appointments: [newAppointment, ...state.appointments],
            lastSync: new Date().toISOString() 
          }));
          
          get().calculateMetrics();

          const clientName = newAppointment.client?.name || 'Cliente';
          
          get().addNotification({
            type: 'appointment',
            title: '✅ Agendamento Criado',
            message: `${clientName} - ${newAppointment.service_type}`,
            appointmentId: newAppointment.id,
            clientName,
            serviceType: newAppointment.service_type,
            scheduledDate: new Date(newAppointment.scheduled_date),
          });

          return newAppointment;
        } catch (error) {
          console.error('Erro ao adicionar appointment:', error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updateAppointment: async (id, appointmentData) => {
        try {
          set({ isLoading: true});

          const { id: _, created_at: __, ...updateData } = appointmentData as any;

          const { data, error } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', id)
            .select('*');
          
          if (error) throw error;

          if (!data || data.length === 0) {
            console.error('⚠️ Update falhou');
            return false;
          }

          const updatedAppointment = data[0] as Appointment;

          set(state => ({ 
            appointments: state.appointments.map(a => a.id === id ? { ...a, ...updatedAppointment } : a),
            lastSync: new Date().toISOString() 
          }));
          
          get().calculateMetrics();
          return true;
        } catch (error) {
          console.error('Erro ao atualizar appointment:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteAppointment: async (id) => {
        try {
          set({ isLoading: true });

          const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set(state => ({ 
            appointments: state.appointments.filter(a => a.id !== id),
            lastSync: new Date().toISOString() 
          }));
          
          get().calculateMetrics();
          return true;
        } catch (error) {
          console.error('Erro ao excluir appointment:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      completeAppointment: async (id, paymentMethod, finalPrice) => {
        try {
          const appointment = get().appointments.find(a => a.id === id);
          if (!appointment) return false;

          const updates: Partial<Appointment> = {
            status: 'completed',
            payment_method: paymentMethod?.toLowerCase() || 'dinheiro',
            price: finalPrice ?? appointment.price,
            completed_at: new Date().toISOString(),
          };

          const success = await get().updateAppointment(id, updates);
          
          if (success && appointment.client_id) {
            const client = get().clients.find(c => c.id === appointment.client_id);
            if (client) {
              await get().updateClient(appointment.client_id, {
                total_visits: (client.total_visits || 0) + 1,
                total_spent: (client.total_spent || 0) + (finalPrice ?? appointment.price),
                last_visit: new Date().toISOString()
              });

              await get().addLoyaltyPoint?.(appointment.client_id, id);
            }
          }

          return success;
        } catch (error) {
          console.error('Erro ao completar appointment:', error);
          return false;
        }
      },

      cancelAppointment: async (id) => {
        try {
          const appointment = get().appointments.find(a => a.id === id);
          if (!appointment) return false;

          const success = await get().updateAppointment(id, { status: 'cancelled' });

          if (success) {
            const client = appointment.client_id ? get().getClientById(appointment.client_id) : null;
            get().addNotification({
              type: 'cancellation',
              title: '❌ Cancelamento',
              message: `${client?.name || 'Cliente'} - ${appointment.service_type}`,
              appointmentId: appointment.id,
              clientName: client?.name || 'Cliente',
              serviceType: appointment.service_type,
              scheduledDate: new Date(appointment.scheduled_date),
            });
          }

          return success;
        } catch (error) {
          console.error('Erro ao cancelar appointment:', error);
          return false;
        }
      },

      // ============================================
      // SERVICES
      // ============================================

      fetchServices: async () => {
        try {
          const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('active', true)
            .order('name');

          if (error) throw error;

          if (data?.length) {
            set({ 
              services: data,
              lastSync: new Date().toISOString() 
            });
          }
        } catch (error) {
          console.error('Erro ao buscar serviços:', error);
        }
      },

      // ============================================
      // MÉTODOS DE CÁLCULO
      // ============================================

      getTodaysAppointments: () => getAppointmentsByDate(get().appointments, new Date()),
      getClientById: (id) => get().clients.find(c => c.id === id),
      getRecentClients: () => get().clients
        .filter(c => c.last_visit)
        .sort((a, b) => new Date(b.last_visit!).getTime() - new Date(a.last_visit!).getTime())
        .slice(0, 10),

      calculateMetrics: () => {
        const appointments = get().appointments;
        const todaysAppointments = getAppointmentsByDate(appointments, new Date());

        const todayRevenue = todaysAppointments
          .filter(a => a.status === 'completed')
          .reduce((sum, a) => sum + (Number(a.price) || 0), 0);

        const metrics: DashboardMetrics = {
          todayRevenue,
          todayAppointments: todaysAppointments.length,
          weeklyRevenue: getWeeklyRevenue(appointments),
          monthlyRevenue: getMonthlyRevenue(appointments),
          completedToday: todaysAppointments.filter(a => a.status === 'completed').length,
          scheduledToday: todaysAppointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length,
        };

        set({ metrics });
      },

      // ============================================
      // CLIENTES MENSAIS
      // ============================================

      fetchMonthlyClients: async () => {
        try {
          set({ monthlyClientsLoading: true });

          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) throw new Error('Não autenticado');

          const { data: monthlyClientsData, error: mcError } = await supabase
            .from('monthly_clients')
            .select('*')
            .eq('professional_id', userAuth.user.id)
            .order('created_at', { ascending: false });

          if (mcError) throw mcError;

          if (!monthlyClientsData || monthlyClientsData.length === 0) {
            set({ monthlyClients: [], monthlyClientsLoading: false });
            return;
          }

          const clientIds = monthlyClientsData.map(mc => mc.client_id);

          const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('id, name, phone, email')
            .in('id', clientIds);

          if (clientsError) throw clientsError;

          const monthlyClientIds = monthlyClientsData.map(mc => mc.id);
          const { data: schedulesData, error: schedulesError } = await supabase
            .from('monthly_schedules')
            .select('*')
            .in('monthly_client_id', monthlyClientIds)
            .eq('active', true)
            .order('day_of_week');

          if (schedulesError) throw schedulesError;

          const monthlyClientsWithDetails: MonthlyClientWithDetails[] = monthlyClientsData
            .map(mc => {
              const client = clientsData?.find(c => c.id === mc.client_id);
              if (!client) return null;
              
              const schedules = schedulesData?.filter(s => s.monthly_client_id === mc.id) || [];

              return {
                ...mc,
                client,
                schedules
              };
            })
            .filter(Boolean) as MonthlyClientWithDetails[];

          set({ 
            monthlyClients: monthlyClientsWithDetails,
            monthlyClientsLoading: false,
            lastSync: new Date().toISOString() 
          });
        } catch (error) {
          console.error('❌ Erro ao buscar clientes mensais:', error);
          set({ monthlyClientsLoading: false });
        }
      },

      addMonthlyClient: async (data) => {
        return get().convertToMonthlyClient(data);
      },

      updateMonthlyClient: async (id, data) => {
        try {
          set({ monthlyClientsLoading: true });
          
          const { id: _, created_at: __, ...updateData } = data as any;

          const { data: updated, error } = await supabase
            .from('monthly_clients')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();

          if (error) throw error;

          set(state => ({
            monthlyClients: state.monthlyClients.map(mc => 
              mc.id === id ? { ...mc, ...updated } : mc
            ),
            lastSync: new Date().toISOString(),
            monthlyClientsLoading: false
          }));

          await get().fetchMonthlyClients();
          return true;
        } catch (error) {
          console.error('❌ Erro ao atualizar cliente mensal:', error);
          set({ monthlyClientsLoading: false });
          return false;
        }
      },

      updateMonthlySchedules: async (monthlyClientId, schedules) => {
        try {
          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) throw new Error('Não autenticado');

          await supabase
            .from('monthly_schedules')
            .delete()
            .eq('monthly_client_id', monthlyClientId);

          const schedulesToInsert = schedules.map(schedule => ({
            monthly_client_id: monthlyClientId,
            day_of_week: schedule.dayOfWeek,
            time: schedule.time,
            service_type: schedule.serviceType,
            active: true,
            professional_id: userAuth.user.id
          }));

          const { error } = await supabase
            .from('monthly_schedules')
            .insert(schedulesToInsert);

          if (error) throw error;

          await get().fetchMonthlyClients();
          return true;
        } catch (error) {
          console.error('Erro ao atualizar schedules:', error);
          return false;
        }
      },

      deleteMonthlyClient: async (id) => {
        return get().convertToNormalClient(id);
      },

      convertToMonthlyClient: async (data) => {
        try {
          set({ monthlyClientsLoading: true });

          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) throw new Error('Não autenticado');

          const client = get().clients.find(c => c.id === data.clientId);
          if (!client) {
            toast.error('Cliente não encontrado!');
            set({ monthlyClientsLoading: false });
            return null;
          }

          const existing = get().monthlyClients.find(
            mc => mc.client_id === data.clientId && mc.status === 'active'
          );
          
          if (existing) {
            toast.error('Este cliente já possui um plano mensal ativo!');
            set({ monthlyClientsLoading: false });
            return null;
          }

          const { data: existingInDb, error: checkError } = await supabase
            .from('monthly_clients')
            .select('id, status')
            .eq('client_id', data.clientId)
            .in('status', ['active', 'suspended'])
            .maybeSingle();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('❌ Erro ao verificar plano existente:', checkError);
          }

          if (existingInDb) {
            toast.error(`Este cliente já possui um plano ${existingInDb.status === 'active' ? 'ativo' : 'suspenso'}!`);
            set({ monthlyClientsLoading: false });
            return null;
          }

          const { data: existingAppointments, error: fetchError } = await supabase
            .from('appointments')
            .select('scheduled_date, status, professional_id')
            .eq('professional_id', userAuth.user.id)
            .neq('status', 'cancelled');

          if (fetchError) throw fetchError;

          const pricePerVisit = data.schedules.length > 0 
            ? data.monthlyPrice / data.schedules.length 
            : data.monthlyPrice;

          const appointmentsToInsert = data.schedules.map(schedule => {
            const dateToUse = (schedule as any).fullDate || data.startDate;
            const [year, month, day] = dateToUse.split('-').map(Number);
            const [hours, minutes] = schedule.time.split(':').map(Number);
            const scheduledDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

            return {
              client_id: data.clientId,
              scheduled_date: scheduledDate.toISOString(),
              service_type: schedule.serviceType,
              status: 'scheduled',
              price: pricePerVisit,
              payment_method: null,
              created_via: 'manual',
              notes: `🔄 Agendamento Recorrente - Cliente Mensal - ${client.name}`,
              professional_id: userAuth.user.id
            };
          });

          const conflicts = [];
          const existingTimestamps = new Set(
            (existingAppointments || []).map(apt => {
              const timestamp = new Date(apt.scheduled_date).getTime();
              return `${apt.professional_id}-${timestamp}`;
            })
          );

          for (const apt of appointmentsToInsert) {
            const aptDate = new Date(apt.scheduled_date);
            const aptTimestamp = aptDate.getTime();
            const key = `${apt.professional_id}-${aptTimestamp}`;
            
            if (existingTimestamps.has(key)) {
              const dateStr = aptDate.toLocaleString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
              });
              
              conflicts.push({ date: aptDate, dateStr, timestamp: aptTimestamp });
            }
          }

          if (conflicts.length > 0) {
            const conflictMessages = conflicts.map(c => c.dateStr);
            toast.error(
              `${conflicts.length} horário(s) já ocupado(s): ${conflictMessages.slice(0, 3).join(', ')}${conflicts.length > 3 ? '...' : ''}`,
              { duration: 6000 }
            );
            set({ monthlyClientsLoading: false });
            return null;
          }

          const nextPaymentDate = new Date(data.startDate);
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

          const monthlyClientPayload = {
            client_id: data.clientId,
            plan_type: data.planType,
            monthly_price: data.monthlyPrice,
            start_date: data.startDate,
            next_payment_date: nextPaymentDate.toISOString(),
            status: 'active',
            payment_status: 'pending',
            total_visits: 0,
            notes: data.notes || null,
            professional_id: userAuth.user.id
          };

          const { data: newMonthlyClient, error: mcError } = await supabase
            .from('monthly_clients')
            .insert(monthlyClientPayload)
            .select()
            .single();

          if (mcError) {
            if ((mcError as any).code === '42501' || (mcError as any).status === 403) {
              toast.error('❌ Erro de permissão: Verifique as políticas RLS!');
            } else {
              toast.error(`Erro ao criar plano: ${mcError.message}`);
            }
            throw mcError;
          }

          if (data.schedules.length > 0) {
            const uniqueSchedulesMap = new Map<string, typeof data.schedules[0]>();
            data.schedules.forEach(schedule => {
              const key = `${schedule.dayOfWeek}-${schedule.time}`;
              if (!uniqueSchedulesMap.has(key)) {
                uniqueSchedulesMap.set(key, schedule);
              }
            });

            const uniqueSchedules = Array.from(uniqueSchedulesMap.values());
            const schedulesToInsert = uniqueSchedules.map(schedule => ({
              monthly_client_id: newMonthlyClient.id,
              day_of_week: schedule.dayOfWeek,
              time: schedule.time,
              service_type: schedule.serviceType,
              active: true,
              professional_id: userAuth.user.id
            }));

            const { error: schedulesError } = await supabase
              .from('monthly_schedules')
              .insert(schedulesToInsert);

            if (schedulesError) {
              await supabase.from('monthly_clients').delete().eq('id', newMonthlyClient.id);
              throw schedulesError;
            }

            const insertedAppointments = [];
            const failedAppointments = [];

            for (const apt of appointmentsToInsert) {
              try {
                const { data: insertedApt, error: singleInsertError } = await supabase
                  .from('appointments')
                  .insert([apt])
                  .select(`
                    *,
                    client:clients!client_id (
                      id,
                      name,
                      phone,
                      email
                    )
                  `)
                  .single();

                if (singleInsertError) {
                  const aptDate = new Date(apt.scheduled_date);
                  failedAppointments.push({
                    date: aptDate.toLocaleString('pt-BR'),
                    error: singleInsertError.message
                  });
                } else {
                  insertedAppointments.push(insertedApt);
                }
              } catch (err) {
                failedAppointments.push({
                  date: new Date(apt.scheduled_date).toLocaleString('pt-BR'),
                  error: 'Erro desconhecido'
                });
              }
            }

            if (failedAppointments.length > 0) {
              if (insertedAppointments.length === 0) {
                await supabase.from('monthly_clients').delete().eq('id', newMonthlyClient.id);
                await supabase.from('monthly_schedules').delete().eq('monthly_client_id', newMonthlyClient.id);
                toast.error('Todos os horários estão ocupados. Plano não foi criado.');
                set({ monthlyClientsLoading: false });
                return null;
              }
              
              toast.warning(
                `⚠️ Plano criado, mas ${failedAppointments.length} horário(s) já estava(m) ocupado(s). ${insertedAppointments.length} agendamento(s) criado(s).`,
                { duration: 5000 }
              );
            } else {
              toast.success(
                `✅ ${client.name} agora é cliente mensal! ${insertedAppointments.length} agendamentos criados.`,
                { duration: 4000 }
              );
            }

            await get().fetchAppointments();
          }

          await get().fetchMonthlyClients();
          set({ monthlyClientsLoading: false });
          return newMonthlyClient;
        } catch (error) {
          console.error('❌ Erro ao converter para cliente mensal:', error);
          toast.error('Erro ao criar plano mensal');
          set({ monthlyClientsLoading: false });
          return null;
        }
      },

      convertToNormalClient: async (monthlyClientId) => {
        try {
          set({ monthlyClientsLoading: true });

          const monthlyClient = get().monthlyClients.find(mc => mc.id === monthlyClientId);
          if (!monthlyClient) {
            toast.error('Cliente mensal não encontrado!');
            set({ monthlyClientsLoading: false });
            return false;
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const { data: futureAppointments, error: fetchError } = await supabase
            .from('appointments')
            .select('id, scheduled_date, notes')
            .eq('client_id', monthlyClient.client_id)
            .gte('scheduled_date', today.toISOString())
            .or('notes.ilike.%Cliente Mensal%,notes.ilike.%Recorrente%');

          if (fetchError) {
            console.error('❌ Erro ao buscar agendamentos:', fetchError);
          }

          const appointmentsToDelete = futureAppointments?.filter(apt => 
            apt.notes?.includes('Cliente Mensal') || 
            apt.notes?.includes('Recorrente')
          ) || [];

          const appointmentIds = appointmentsToDelete.map(a => a.id);

          if (appointmentIds.length > 0) {
            const { error: deleteAppsError } = await supabase
              .from('appointments')
              .delete()
              .in('id', appointmentIds);

            if (deleteAppsError) {
              console.error('❌ Erro ao excluir agendamentos:', deleteAppsError);
              toast.error('Erro ao excluir agendamentos vinculados');
              set({ monthlyClientsLoading: false });
              return false;
            }
          }

          const { error } = await supabase
            .from('monthly_clients')
            .delete()
            .eq('id', monthlyClientId);

          if (error) throw error;

          set(state => ({
            monthlyClients: state.monthlyClients.filter(mc => mc.id !== monthlyClientId),
            appointments: state.appointments.filter(apt => !appointmentIds.includes(apt.id)),
            lastSync: new Date().toISOString(),
            monthlyClientsLoading: false
          }));

          await get().fetchAppointments();

          toast.success(
            appointmentsToDelete.length > 0
              ? `✅ Plano cancelado! ${appointmentsToDelete.length} agendamento(s) excluído(s).`
              : '✅ Plano mensal cancelado!'
          );
          
          return true;
        } catch (error) {
          console.error('❌ Erro ao excluir:', error);
          toast.error('Erro ao cancelar plano');
          set({ monthlyClientsLoading: false });
          return false;
        }
      },

      suspendMonthlyClient: async (id) => {
        const success = await get().updateMonthlyClient(id, { status: 'suspended' });
        if (success) toast.success('Plano suspenso!');
        return success;
      },

      reactivateMonthlyClient: async (id) => {
        const success = await get().updateMonthlyClient(id, { status: 'active' });
        if (success) toast.success('Plano reativado!');
        return success;
      },

      markMonthlyPaymentAsPaid: async (id) => {
        try {
          const monthlyClient = get().monthlyClients.find(mc => mc.id === id);
          if (!monthlyClient) return false;

          const nextPaymentDate = new Date();
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

          const success = await get().updateMonthlyClient(id, {
            payment_status: 'paid',
            last_payment_date: new Date().toISOString(),
            next_payment_date: nextPaymentDate.toISOString()
          });

          if (success) toast.success('Pagamento registrado!');
          return success;
        } catch (error) {
          console.error('❌ Erro:', error);
          return false;
        }
      },

      renewMonthlyAppointments: async (monthlyClientId: string) => {
        try {
          const monthlyClient = get().monthlyClients.find(mc => mc.id === monthlyClientId);
          if (!monthlyClient) return false;
      
          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) throw new Error('Não autenticado');
      
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(1);
      
          const monthlyAppointments = generateMonthlyAppointments(
            monthlyClient.schedules.map(s => ({
              dayOfWeek: s.day_of_week,
              time: s.time,
              serviceType: s.service_type
            })),
            monthlyClient.client_id,
            nextMonth.toISOString(),
            monthlyClient.monthly_price
          );
      
          if (monthlyAppointments.length > 0) {
            const appointmentsToInsert = monthlyAppointments.map(apt => ({
              ...apt,
              professional_id: userAuth.user.id
            }));
      
            const { error } = await supabase
              .from('appointments')
              .insert(appointmentsToInsert);
      
            if (error) throw error;
      
            await get().fetchAppointments();
            toast.success(`Agendamentos do próximo mês criados!`);
            return true;
          }
      
          return false;
        } catch (error) {
          console.error('Erro ao renovar agendamentos:', error);
          toast.error('Erro ao renovar agendamentos mensais');
          return false;
        }
      },

      getMonthlyClientByClientId: (clientId) => {
        return get().monthlyClients.find(mc => mc.client_id === clientId);
      },

      isClientMonthly: (clientId) => {
        return get().monthlyClients.some(
          mc => mc.client_id === clientId && mc.status === 'active'
        );
      },

      setupMonthlyClientsRealtime: () => {
        const channel = supabase
          .channel('monthly-clients-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'monthly_clients' },
            async () => {
              await get().fetchMonthlyClients();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'monthly_schedules' },
            async () => {
              await get().fetchMonthlyClients();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      },

      // ============================================
      // 🔥 FUNÇÕES DE FIDELIDADE
      // ============================================
      ...loyaltyStoreFunctions(set, get),
      
    }),
    {
      name: 'david-barber-store',
      partialize: (state) => ({
        clients: state.clients,
        appointments: state.appointments,
        services: state.services,
        selectedDate: state.selectedDate,
        lastSync: state.lastSync,
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        monthlyClients: state.monthlyClients,
        
        loyaltySettings: state.loyaltySettings,
        loyaltyClients: state.loyaltyClients,
        loyaltyHistory: state.loyaltyHistory,
        loyaltyStats: state.loyaltyStats,
        loyaltyLoading: state.loyaltyLoading,
      }),
      version: 1.3,
    }
  )
);