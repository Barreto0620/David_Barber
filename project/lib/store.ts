// @ts-nocheck
// lib/store.ts - VERSÃO FINAL COMPLETA E CORRIGIDA COM FILTROS DE AUTH
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Client, Appointment, Service, DashboardMetrics, MonthlyClient, MonthlySchedule, MonthlyClientWithDetails } from '@/types/database';
import type { Notification, NotificationType } from '@/types/notifications';
import { getAppointmentsByDate, getMonthlyRevenue, getWeeklyRevenue } from '@/lib/utils/appointments';
import { toast } from 'sonner';

// ============================================
// 🔥 IMPORTS DE FIDELIDADE (Caminho Ajustado e Importação Corrigida)
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
      setClients: (clients) => { set({ clients }); get().calculateMetrics(); get().calculateLoyaltyStats(); }, 
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
      // SINCRONIZAÇÃO E REALTIME
      // ============================================

      // 🔥 REALTIME PRINCIPAL E MENSAL
      setupRealtimeSubscription: () => {
        console.log('🔴 REALTIME: Iniciando listener...');

        const appointmentChannel = supabase
          .channel('appointments-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'appointments',
            },
            async (payload) => {
              console.log('🆕 INSERT DETECTADO:', payload.new);

              const newAppointment = payload.new as Appointment;

              // 🔥 BUSCA DADOS DO CLIENTE
              if (newAppointment.client_id) {
                const { data: clientData } = await supabase
                  .from('clients')
                  .select('id, name, phone, email')
                  .eq('id', newAppointment.client_id)
                  .maybeSingle();
                
                if (clientData) {
                  newAppointment.client = clientData;
                }
              }

              set((state) => ({
                appointments: [newAppointment, ...state.appointments],
                lastSync: new Date().toISOString(),
              }));

              get().calculateMetrics();

              const clientName = newAppointment.client?.name || 'Cliente';

              get().addNotification({
                type: 'appointment',
                title: newAppointment.created_via === 'manual' ? '✅ Agendamento Criado' : '📅 Novo Agendamento Online',
                message: `${clientName} - ${newAppointment.service_type}`,
                appointmentId: newAppointment.id,
                clientName,
                serviceType: newAppointment.service_type,
                scheduledDate: new Date(newAppointment.scheduled_date),
              });

              console.log('✅ Appointment adicionado INSTANTANEAMENTE');
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
              console.log('🔄 UPDATE DETECTADO:', payload.new);

              const updatedAppointment = payload.new as Appointment;

              // 🔥 BUSCA DADOS DO CLIENTE
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
              console.log('🗑️ DELETE DETECTADO:', payload.old);

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
              console.log('✅ REALTIME APPOINTMENTS CONECTADO');
            } else {
              console.log('📡 Status Realtime Appointments:', status);
            }
          });

        const monthlyChannelUnsub = get().setupMonthlyClientsRealtime(); 
        const loyaltyChannelUnsub = get().setupLoyaltyRealtime(); 

        return () => {
          console.log('🔴 REALTIME: Desconectando...');
          supabase.removeChannel(appointmentChannel);
          monthlyChannelUnsub();
          loyaltyChannelUnsub();
        };
      },

      // 🔥 SYNC PRINCIPAL COM FIDELIDADE E MENSAL
      syncWithSupabase: async () => {
        try {
          await Promise.all([
            get().fetchClients(),
            get().fetchAppointments(),
            get().fetchServices(),
            get().fetchMonthlyClients(),
            get().fetchLoyaltySettings(), 
            get().fetchLoyaltyClients(), 
          ]);
          console.log('✅ Sincronização completa');
        } catch (error) {
          console.error('Erro na sincronização:', error);
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
          get().fetchLoyaltyClients(); 
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
          get().fetchLoyaltyClients(); 
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
          // 1. Verifica autenticação
          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) {
            console.warn('⚠️ fetchClients: Usuário não autenticado.');
            return; // Para a execução se não houver usuário
          }
          
          // 2. Adiciona filtro por professional_id (VITAL para RLS/Propriedade do sistema)
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('professional_id', userAuth.user.id) // 🔥 CORREÇÃO: Filtra pelo ID do profissional
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

      fetchAppointments: async () => {
        try {
          console.log('🔄 Buscando appointments...');
          
          // 1. Verifica autenticação
          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) {
            console.warn('⚠️ fetchAppointments: Usuário não autenticado.');
            return; // Para a execução
          }
          
          const currentIds = new Set(get().appointments.map(a => a.id));

          // 2. Adiciona filtro por professional_id
          const { data, error } = await supabase
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
            .eq('professional_id', userAuth.user.id) // 🔥 CORREÇÃO: Filtra pelo ID do profissional
            .order('scheduled_date', { ascending: false });
          
          if (error) throw error;

          const fetchedAppointments = data || [];
          console.log(`📊 ${fetchedAppointments.length} appointments encontrados`);

          const newAppointments = fetchedAppointments.filter(apt => !currentIds.has(apt.id));

          if (newAppointments.length > 0) {
            console.log(`🆕 ${newAppointments.length} novos detectados`);

            for (const apt of newAppointments) {
              const isRecent = new Date(apt.created_at).getTime() > (Date.now() - 10000);
              
              if (isRecent) { 
                // 🔥 USA O NOME DO CLIENT DO JOIN
                const clientName = apt.client?.name || 'Cliente';

                get().addNotification({
                  type: 'appointment',
                  title: apt.created_via === 'manual' ? '✅ Agendamento Criado' : '📅 Novo Agendamento Online',
                  message: `${clientName} - ${apt.service_type}`,
                  appointmentId: apt.id,
                  clientName,
                  serviceType: apt.service_type,
                  scheduledDate: new Date(apt.scheduled_date),
                });
              }
            }
          }

          set({ 
            appointments: fetchedAppointments,
            lastSync: new Date().toISOString() 
          });

          get().calculateMetrics();
        } catch (error) {
          console.error('❌ Erro ao buscar appointments:', error);
        }
      },

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

          // 🔥 INSERT COM JOIN
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

          // 🔥 USA O NOME DO CLIENT DO JOIN
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

      // 🔥 COMPLETA APPOINTMENT + PONTO DE FIDELIDADE
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

              // 🔥 ADICIONA PONTO DE FIDELIDADE
              await get().addLoyaltyPoint(appointment.client_id, id);
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
          console.log('🔄 Buscando clientes mensais...');

          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) throw new Error('Não autenticado');

          // 🔥 BUSCA MONTHLY CLIENTS COM FILTRO DE PROFESSIONAL
          const { data: monthlyClientsData, error: mcError } = await supabase
            .from('monthly_clients')
            .select('*')
            .eq('professional_id', userAuth.user.id)
            .order('created_at', { ascending: false });

          if (mcError) {
            console.error('❌ Erro ao buscar monthly_clients:', mcError);
            throw mcError;
          }

          console.log(`📊 ${monthlyClientsData?.length || 0} monthly_clients encontrados`);

          if (!monthlyClientsData || monthlyClientsData.length === 0) {
            set({ monthlyClients: [], monthlyClientsLoading: false });
            console.log('📊 Nenhum cliente mensal encontrado');
            return;
          }

          // 🔥 BUSCA CLIENTES
          const clientIds = monthlyClientsData.map(mc => mc.client_id);
          console.log('🔍 Buscando clientes com IDs:', clientIds);

          const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('id, name, phone, email')
            .in('id', clientIds);

          if (clientsError) {
            console.error('❌ Erro ao buscar clients:', clientsError);
            throw clientsError;
          }

          console.log(`👥 ${clientsData?.length || 0} clientes encontrados`);

          // Busca schedules separadamente
          const monthlyClientIds = monthlyClientsData.map(mc => mc.id);
          const { data: schedulesData, error: schedulesError } = await supabase
            .from('monthly_schedules')
            .select('*')
            .in('monthly_client_id', monthlyClientIds)
            .eq('active', true)
            .order('day_of_week');

          if (schedulesError) {
            console.error('❌ Erro ao buscar schedules:', schedulesError);
            throw schedulesError;
          }

          console.log(`📅 ${schedulesData?.length || 0} schedules encontrados`);

          // Monta os objetos completos
          const monthlyClientsWithDetails: MonthlyClientWithDetails[] = monthlyClientsData
            .map(mc => {
              const client = clientsData?.find(c => c.id === mc.client_id);
              
              if (!client) {
                console.warn(`⚠️ Cliente não encontrado para monthly_client ${mc.id} (client_id: ${mc.client_id})`);
                return null;
              }
              
              const schedules = schedulesData?.filter(s => s.monthly_client_id === mc.id) || [];

              console.log(`✅ Cliente mensal montado: ${client.name} com ${schedules.length} schedules`);

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

          console.log(`✅ ${monthlyClientsWithDetails.length} clientes mensais carregados com sucesso`);
        } catch (error) {
          console.error('❌ Erro ao buscar clientes mensais:', error);
          set({ monthlyClientsLoading: false });
        }
      },

      addMonthlyClient: async (data) => {
        return get().convertToMonthlyClient(data);
      },
// Adicione esta função no store.ts, logo após a função addMonthlyClient

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

    if (error) {
      console.error('❌ Erro ao atualizar cliente mensal:', error);
      throw error;
    }

    // Atualiza o estado local
    set(state => ({
      monthlyClients: state.monthlyClients.map(mc => 
        mc.id === id ? { ...mc, ...updated } : mc
      ),
      lastSync: new Date().toISOString(),
      monthlyClientsLoading: false
    }));

    await get().fetchMonthlyClients(); // Recarrega para garantir dados sincronizados
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente mensal:', error);
    set({ monthlyClientsLoading: false });
    return false;
  }
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

          console.log('🔄 Buscando appointments atualizados do banco...');
          const { data: existingAppointments, error: fetchError } = await supabase
            .from('appointments')
            .select('scheduled_date, status, professional_id')
            .eq('professional_id', userAuth.user.id)
            .neq('status', 'cancelled');

          if (fetchError) {
            console.error('❌ Erro ao buscar appointments:', fetchError);
            throw fetchError;
          }

          console.log(`📋 ${existingAppointments?.length || 0} agendamentos não cancelados encontrados`);

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

          console.log(`📅 Preparando ${appointmentsToInsert.length} agendamentos:`);
          appointmentsToInsert.forEach((apt, i) => {
            const aptDate = new Date(apt.scheduled_date);
            console.log(`  ${i + 1}. ${aptDate.toLocaleString('pt-BR')} - ${apt.service_type}`);
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
              
              console.warn(`⚠️ Conflito detectado: ${dateStr} já ocupado`);
              conflicts.push({ date: aptDate, dateStr, timestamp: aptTimestamp });
            }
          }

          if (conflicts.length > 0) {
            console.error('❌ CONFLITOS DETECTADOS:', conflicts);
            const conflictMessages = conflicts.map(c => c.dateStr);
            toast.error(
              `${conflicts.length} horário(s) já ocupado(s): ${conflictMessages.slice(0, 3).join(', ')}${conflicts.length > 3 ? '...' : ''}`,
              { duration: 6000 }
            );
            set({ monthlyClientsLoading: false });
            return null;
          }

          console.log('✅ Nenhum conflito detectado. Prosseguindo...');

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
            console.error('❌ Erro ao criar cliente mensal:', mcError);
            if ((mcError as any).code === '42501' || (mcError as any).status === 403) {
              toast.error('❌ Erro de permissão: Verifique as políticas RLS!');
            } else {
              toast.error(`Erro ao criar plano: ${mcError.message}`);
            }
            throw mcError;
          }

          console.log('✅ Cliente mensal criado:', newMonthlyClient.id);

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
              console.error('❌ Erro ao criar schedules:', schedulesError);
              await supabase.from('monthly_clients').delete().eq('id', newMonthlyClient.id);
              throw schedulesError;
            }

            console.log(`✅ ${schedulesToInsert.length} schedules criados`);

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
                  console.error(`❌ Erro ao inserir agendamento ${aptDate.toLocaleString('pt-BR')}:`, singleInsertError);
                  failedAppointments.push({
                    date: aptDate.toLocaleString('pt-BR'),
                    error: singleInsertError.message
                  });
                } else {
                  insertedAppointments.push(insertedApt);
                  console.log(`✅ Agendamento criado: ${new Date(apt.scheduled_date).toLocaleString('pt-BR')}`);
                }
              } catch (err) {
                console.error(`❌ Exceção ao inserir:`, err);
                failedAppointments.push({
                  date: new Date(apt.scheduled_date).toLocaleString('pt-BR'),
                  error: 'Erro desconhecido'
                });
              }
            }

            if (failedAppointments.length > 0) {
              console.error('❌ Falhas ao criar agendamentos:', failedAppointments);
              
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
              console.log(`✅ Todos os ${insertedAppointments.length} agendamentos criados com sucesso!`);
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
        console.log('🔴 REALTIME: Clientes mensais...');

        const channel = supabase
          .channel('monthly-clients-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'monthly_clients' },
            async () => {
              console.log('🔄 Mudança em monthly_clients');
              await get().fetchMonthlyClients();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'monthly_schedules' },
            async () => {
              console.log('🔄 Mudança em monthly_schedules');
              await get().fetchMonthlyClients();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ REALTIME MENSAL CONECTADO');
            }
          });

        return () => {
          supabase.removeChannel(channel);
        };
      },


      // ============================================
      // 🔥 FUNÇÕES DE FIDELIDADE (VINDAS DE store-loyalty.ts)
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
        
        // 🔥 ESTADO DE FIDELIDADE PARA PERSISTÊNCIA
        loyaltySettings: state.loyaltySettings,
        loyaltyClients: state.loyaltyClients,
        loyaltyHistory: state.loyaltyHistory,
        loyaltyStats: state.loyaltyStats,
        loyaltyLoading: state.loyaltyLoading,
      }),
      // Versão para forçar recarga após uma grande alteração de schema
      version: 1.1, 
    }
  )
);