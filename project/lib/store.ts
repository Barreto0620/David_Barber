// src/lib/store.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Client, Appointment, Service, DashboardMetrics } from '@/types/database';
import type { Notification, NotificationType } from '@/types/notifications';
import { getAppointmentsByDate, getMonthlyRevenue, getWeeklyRevenue } from '@/lib/utils/appointments';

interface AppStore {
  // State existente
  clients: Client[];
  appointments: Appointment[];
  services: Service[];
  metrics: DashboardMetrics;
  selectedDate: Date;
  isLoading: boolean;
  lastSync: string | null;

  // State de notificações (NOVO)
  notifications: Notification[];
  unreadCount: number;

  // Actions existentes
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
  
  // Actions de notificações (NOVO)
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Supabase sync functions
  syncWithSupabase: () => Promise<void>;
  fetchClients: () => Promise<void>;
  fetchAppointments: () => Promise<void>;
  fetchServices: () => Promise<void>;
  
  // Computed
  getTodaysAppointments: () => Appointment[];
  getClientById: (id: string) => Client | undefined;
  getRecentClients: () => Client[];
  calculateMetrics: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state existente
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

      // Initial state de notificações (NOVO)
      notifications: [],
      unreadCount: 0,

      // Basic setters existentes
      setClients: (clients) => { set({ clients }); get().calculateMetrics(); },
      setAppointments: (appointments) => { set({ appointments }); get().calculateMetrics(); },
      setServices: (services) => set({ services }),
      setMetrics: (metrics) => set({ metrics }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setLoading: (isLoading) => set({ isLoading }),

      // Actions de notificações (NOVO)
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

      // Client operations (mantidos iguais)
      addClient: async (clientData) => {
        try {
          set({ isLoading: true });

          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) throw new Error('Usuário não autenticado.');

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

          const { data, error } = await supabase.from('clients').insert([payload]).select('*').single();
          if (error) throw error;

          const newClient = data as Client;
          set(state => ({ clients: [...state.clients, newClient], lastSync: new Date().toISOString() }));
          get().calculateMetrics();
          console.log(`✅ Cliente adicionado (${newClient.id})`);
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
          if (!id) return false;
          const { id: _, created_at: __, ...updateData } = clientData as any;

          const { data, error } = await supabase.from('clients').update(updateData).eq('id', id).select('*').single();
          
          if (error) throw error;

          set(state => ({ clients: state.clients.map(c => c.id === id ? { ...c, ...data } : c), lastSync: new Date().toISOString() }));
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
          if (!id) return false;

          const { error } = await supabase.from('clients').delete().eq('id', id);
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

      // Appointment operations
      addAppointment: async (appointmentData) => {
        try {
          set({ isLoading: true });

          const { data: userAuth } = await supabase.auth.getUser();
          if (!userAuth.user) throw new Error('Usuário não autenticado.');

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

          const { data, error } = await supabase.from('appointments').insert([cleanData]).select('*').single();
          if (error) throw error;

          const newAppointment = data as Appointment;
          set(state => ({ appointments: [...state.appointments, newAppointment], lastSync: new Date().toISOString() }));
          get().calculateMetrics();

          // ADICIONAR NOTIFICAÇÃO AUTOMATICAMENTE (NOVO)
          const client = newAppointment.client_id ? get().getClientById(newAppointment.client_id) : null;
          get().addNotification({
            type: 'appointment',
            title: '📅 Novo Agendamento Criado',
            message: 'Um novo agendamento foi registrado no sistema',
            appointmentId: newAppointment.id,
            clientName: client?.name || 'Cliente',
            serviceType: newAppointment.service_type,
            scheduledDate: new Date(newAppointment.scheduled_date),
          });

          return newAppointment;
        } catch (error) {
          console.error('Erro ao adicionar agendamento:', error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updateAppointment: async (id, appointmentData) => {
        try {
          set({ isLoading: true });
          if (!id) return false;

          const { data: existing } = await supabase.from('appointments').select('id').eq('id', id).maybeSingle();
          if (!existing) { await get().fetchAppointments(); return false; }

          const { id: _, created_at: __, ...updateData } = appointmentData as any;
          
          if (!updateData.professional_id) {
            const { data: userAuth } = await supabase.auth.getUser();
            if (userAuth.user) {
              updateData.professional_id = userAuth.user.id; 
            }
          }
          
          const { data, error } = await supabase.from('appointments').update(updateData).eq('id', id).select('*');
          
          if (error) throw error;

          if (!data || data.length === 0) {
            console.error('⚠️ Update falhou ou RLS bloqueou a atualização (0 linhas afetadas).');
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
          console.error('Erro ao atualizar agendamento:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteAppointment: async (id) => {
        try {
          set({ isLoading: true });
          if (!id) return false;

          const { error } = await supabase.from('appointments').delete().eq('id', id);
          if (error) throw error;

          set(state => ({ appointments: state.appointments.filter(a => a.id !== id), lastSync: new Date().toISOString() }));
          get().calculateMetrics();
          return true;
        } catch (error) {
          console.error('Erro ao excluir agendamento:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      completeAppointment: async (id, paymentMethod, finalPrice) => {
        try {
          if (!id) return false;

          const appointment = get().appointments.find(a => a.id === id);
          if (!appointment) {
            console.error(`Agendamento ${id} não encontrado no state.`);
            return false;
          }

          const normalizedPaymentMethod = paymentMethod?.toLowerCase() || 'dinheiro';

          const updates: Partial<Appointment> = {
            status: 'completed',
            payment_method: normalizedPaymentMethod,
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
          console.error('Erro ao completar agendamento:', error);
          return false;
        }
      },

      cancelAppointment: async (id) => {
        try {
          if (!id) return false;

          const appointment = get().appointments.find(a => a.id === id);
          if (!appointment) {
            console.error(`Agendamento ${id} não encontrado no state.`);
            return false;
          }

          const updates: Partial<Appointment> = {
            status: 'cancelled',
          };

          const success = await get().updateAppointment(id, updates);

          // ADICIONAR NOTIFICAÇÃO DE CANCELAMENTO (NOVO)
          if (success) {
            const client = appointment.client_id ? get().getClientById(appointment.client_id) : null;
            get().addNotification({
              type: 'cancellation',
              title: '❌ Agendamento Cancelado',
              message: 'Um agendamento foi cancelado',
              appointmentId: appointment.id,
              clientName: client?.name || 'Cliente',
              serviceType: appointment.service_type,
              scheduledDate: new Date(appointment.scheduled_date),
            });
          }

          return success;
        } catch (error) {
          console.error('Erro ao cancelar agendamento:', error);
          return false;
        }
      },

      // Supabase sync functions (mantidos iguais)
      fetchClients: async () => {
        try {
          set({ isLoading: true });
          const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          set({ clients: data || [], lastSync: new Date().toISOString() });
          get().calculateMetrics();
        } catch (error) { console.error('Erro ao buscar clientes:', error); }
        finally { set({ isLoading: false }); }
      },

      fetchAppointments: async () => {
        try {
          set({ isLoading: true });
          const { data, error } = await supabase.from('appointments').select('*').order('scheduled_date', { ascending: false });
          if (error) throw error;
          set({ appointments: data || [], lastSync: new Date().toISOString() });
          get().calculateMetrics();
        } catch (error) { console.error('Erro ao buscar agendamentos:', error); }
        finally { set({ isLoading: false }); }
      },

      fetchServices: async () => {
        try {
          set({ isLoading: true });
          const { data, error } = await supabase.from('services').select('*').eq('active', true).order('name');
          if (error) throw error;
          if (data?.length) set({ services: data, lastSync: new Date().toISOString() });
        } catch (error) { console.error('Erro ao buscar serviços:', error); }
        finally { set({ isLoading: false }); }
      },

      syncWithSupabase: async () => {
        set({ isLoading: true });
        try { await Promise.all([get().fetchClients(), get().fetchAppointments(), get().fetchServices()]); }
        catch (error) { console.error('Erro ao sincronizar com Supabase:', error); }
        finally { set({ isLoading: false }); }
      },

      // Computed functions (mantidos iguais)
      getTodaysAppointments: () => getAppointmentsByDate(get().appointments, new Date()),
      getClientById: (id) => get().clients.find(c => c.id === id),
      getRecentClients: () => get().clients.filter(c => c.last_visit).sort((a,b)=>new Date(b.last_visit!).getTime()-new Date(a.last_visit!).getTime()).slice(0,10),

      calculateMetrics: () => {
        const appointments = get().appointments;
        const todaysAppointments = getAppointmentsByDate(appointments, new Date());

        const todayRevenue = todaysAppointments.filter(a => a.status === 'completed').reduce((sum,a)=>sum+(Number(a.price)||0),0);

        const metrics: DashboardMetrics = {
          todayRevenue,
          todayAppointments: todaysAppointments.length,
          weeklyRevenue: getWeeklyRevenue(appointments),
          monthlyRevenue: getMonthlyRevenue(appointments),
          completedToday: todaysAppointments.filter(a => a.status === 'completed').length,
          scheduledToday: todaysAppointments.filter(a => a.status !== 'completed' && a.status !== 'canceled').length,
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