// // src/lib/store.ts - VERSÃO OTIMIZADA PARA SYNC INSTANT NEO
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Client, Appointment, Service, DashboardMetrics } from '@/types/database';
import type { Notification, NotificationType } from '@/types/notifications';
import { getAppointmentsByDate, getMonthlyRevenue, getWeeklyRevenue } from '@/lib/utils/appointments';

interface AppStore {
  // State
  clients: Client[];
  appointments: Appointment[];
  services: Service[];
  metrics: DashboardMetrics;
  selectedDate: Date;
  isLoading: boolean;
  lastSync: string | null;
  notifications: Notification[];
  unreadCount: number;

  // Actions
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
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Sync
  syncWithSupabase: () => Promise<void>;
  fetchClients: () => Promise<void>;
  fetchAppointments: () => Promise<void>;
  fetchServices: () => Promise<void>;
  setupRealtimeSubscription: () => void;
  
  // Computed
  getTodaysAppointments: () => Appointment[];
  getClientById: (id: string) => Client | undefined;
  getRecentClients: () => Client[];
  calculateMetrics: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
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

      // Setters
      setClients: (clients) => { set({ clients }); get().calculateMetrics(); },
      setAppointments: (appointments) => { set({ appointments }); get().calculateMetrics(); },
      setServices: (services) => set({ services }),
      setMetrics: (metrics) => set({ metrics }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setLoading: (isLoading) => set({ isLoading }),

      // Notifications
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

      // 🚀 REALTIME INSTANT NEO - VERSÃO OTIMIZADA
      setupRealtimeSubscription: () => {
        console.log('🔴 REALTIME: Iniciando listener...');

        const channel = supabase
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

              // ✅ ADICIONA IMEDIATAMENTE AO ESTADO (INSTANT NEO!)
              set((state) => ({
                appointments: [newAppointment, ...state.appointments],
                lastSync: new Date().toISOString(),
              }));

              get().calculateMetrics();

              // >>>>>>>>>>>>> CORREÇÃO APLICADA AQUI <<<<<<<<<<<<<
              // Notificação para TODOS os novos, incluindo os ONLINE
              // Nota: o agendamento manual feito pelo barbeiro também acionará isso, 
              // mas ele já recebe o toast de confirmação. Vamos deixar a notificação aqui
              // para garantir que os ONLINE SEMPRE cheguem.
              
              // Busca nome do cliente
              let clientName = 'Cliente';
              if (newAppointment.client_id) {
                const client = get().clients.find(c => c.id === newAppointment.client_id);
                if (client) {
                  clientName = client.name;
                } else {
                  const { data } = await supabase
                    .from('clients')
                    .select('name')
                    .eq('id', newAppointment.client_id)
                    .maybeSingle();
                  if (data) clientName = data.name;
                }
              }

              // Cria notificação (SEMPRE PARA INSERTS NO DB)
              get().addNotification({
                type: 'appointment',
                title: newAppointment.created_via === 'manual' ? '✅ Agendamento Criado' : '📅 Novo Agendamento Online',
                message: `${clientName} - ${newAppointment.service_type}`,
                appointmentId: newAppointment.id,
                clientName,
                serviceType: newAppointment.service_type,
                scheduledDate: new Date(newAppointment.scheduled_date),
              });

              console.log(`✅ Notificação criada para agendamento ${newAppointment.created_via === 'manual' ? 'MANUAL' : 'ONLINE'} (Realtime)`);
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
            (payload) => {
              console.log('🔄 UPDATE DETECTADO:', payload.new);

              const updatedAppointment = payload.new as Appointment;

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
              console.log('✅ REALTIME CONECTADO E ATIVO');
            } else {
              console.log('📡 Status Realtime:', status);
            }
          });

        return () => {
          console.log('🔴 REALTIME: Desconectando...');
          supabase.removeChannel(channel);
        };
      },

      // Client operations
      addClient: async (clientData) => {
        try {
          set({ isLoading: true });

          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) throw new Error('Não autenticado');

          const payload = {
            name: clientData.name?.trim(),
            phone: clientData.phone?.trim(),
            email: clientData.email?.trim() || null,
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
          return true;
        } catch (error) {
          console.error('Erro ao excluir cliente:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // ⚡ FETCH ULTRA-RÁPIDO
      fetchAppointments: async () => {
        try {
          console.log('🔄 Buscando appointments...');
          
          const currentIds = new Set(get().appointments.map(a => a.id));

          // Busca TODOS sem filtro
          const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('scheduled_date', { ascending: false });
          
          if (error) throw error;

          const fetchedAppointments = data || [];
          console.log(`📊 ${fetchedAppointments.length} appointments encontrados`);

          // Detecta novos
          const newAppointments = fetchedAppointments.filter(apt => !currentIds.has(apt.id));

          if (newAppointments.length > 0) {
            console.log(`🆕 ${newAppointments.length} novos detectados`);

            // Cria notificações apenas para novos
            for (const apt of newAppointments) {
              const isRecent = new Date(apt.created_at).getTime() > (Date.now() - 10000);
              
              // >>>>>>>>>>>>> CORREÇÃO APLICADA AQUI <<<<<<<<<<<<<
              // Notifica se for recente (criado há menos de 10s), independente de ser manual ou online.
              if (isRecent) { 
                let clientName = 'Cliente';
                if (apt.client_id) {
                  const client = get().clients.find(c => c.id === apt.client_id);
                  if (client) clientName = client.name;
                }

                get().addNotification({
                  type: 'appointment',
                  title: apt.created_via === 'manual' ? '✅ Agendamento Criado' : '📅 Novo Agendamento Online',
                  message: `${clientName} - ${apt.service_type}`,
                  appointmentId: apt.id,
                  clientName,
                  serviceType: apt.service_type,
                  scheduledDate: new Date(apt.scheduled_date),
                });
                console.log(`✅ Notificação criada para agendamento ${apt.created_via === 'manual' ? 'MANUAL' : 'ONLINE'} (Polling)`);
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

          const { data, error } = await supabase
            .from('appointments')
            .insert([cleanData])
            .select('*')
            .single();

          if (error) throw error;

          const newAppointment = data as Appointment;
          
          // Adiciona ao estado
          set(state => ({ 
            appointments: [newAppointment, ...state.appointments],
            lastSync: new Date().toISOString() 
          }));
          
          get().calculateMetrics();

          // Notificação para criação manual (mantida)
          // Se este agendamento for manual (criado agora), esta notificação será a que o usuário verá
          // imediatamente, além da que virá do Realtime/Polling.
          const client = newAppointment.client_id ? get().getClientById(newAppointment.client_id) : null;
          get().addNotification({
            type: 'appointment',
            title: '✅ Agendamento Criado',
            message: `${client?.name || 'Cliente'} - ${newAppointment.service_type}`,
            appointmentId: newAppointment.id,
            clientName: client?.name || 'Cliente',
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

      fetchClients: async () => {
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          set({ 
            clients: data || [],
            lastSync: new Date().toISOString() 
          });
          
          get().calculateMetrics();
        } catch (error) {
          console.error('Erro ao buscar clientes:', error);
        }
      },

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

      syncWithSupabase: async () => {
        try {
          await Promise.all([
            get().fetchClients(),
            get().fetchAppointments(),
            get().fetchServices()
          ]);
          console.log('✅ Sincronização completa');
        } catch (error) {
          console.error('Erro na sincronização:', error);
        }
      },

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
      }),
    }
  )
);