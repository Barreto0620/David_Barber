// lib/store.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Client, Appointment, Service, DashboardMetrics } from '@/types/database';
// ✅ IMPORTA AS FUNÇÕES DE UTILIDADE CORRIGIDAS
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

  // Actions
  setClients: (clients: Client[]) => void;
  setAppointments: (appointments: Appointment[]) => void;
  setServices: (services: Service[]) => void;
  setMetrics: (metrics: DashboardMetrics) => void;
  setSelectedDate: (date: Date) => void;
  setLoading: (loading: boolean) => void;
  
  addClient: (client: Omit<Client, 'id' | 'created_at'>) => Promise<Client | null>;
  updateClient: (id: string, client: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
  
  addAppointment: (appointment: Omit<Appointment, 'id' | 'created_at'>) => Promise<Appointment | null>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
  completeAppointment: (id: string, paymentMethod: string, finalPrice?: number) => Promise<boolean>;
  
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

      // Basic setters
      setClients: (clients) => {
        set({ clients });
        get().calculateMetrics();
      },
      
      setAppointments: (appointments) => {
        set({ appointments });
        get().calculateMetrics();
      },
      
      setServices: (services) => set({ services }),
      setMetrics: (metrics) => set({ metrics }),
      // ✅ ADICIONADO CONSOLE.LOG PARA DEBUG
      setSelectedDate: (selectedDate) => {
        console.log('ℹ️ Nova data selecionada no estado:', selectedDate);
        set({ selectedDate });
      },
      setLoading: (isLoading) => set({ isLoading }),

      // Client operations
      addClient: async (clientData) => {
        try {
          set({ isLoading: true });
          const dataToInsert = {
            name: clientData.name.trim(),
            phone: clientData.phone.trim(),
            email: clientData.email?.trim() || null,
            notes: clientData.notes?.trim() || null,
            total_visits: clientData.total_visits || 0,
            total_spent: clientData.total_spent || 0,
            preferences: clientData.preferences || null,
            last_visit: clientData.last_visit || null,
          };
          const { data, error } = await supabase.from('clients').insert([dataToInsert]).select('*').single();
          if (error) throw error;
          const newClient = data as Client;
          set(state => ({ clients: [...state.clients, newClient], lastSync: new Date().toISOString() }));
          get().calculateMetrics();
          return newClient;
        } catch (error) {
          console.error('❌ Error adding client:', error);
          const tempId = `temp-${Date.now()}`;
          const localClient: Client = { ...clientData, id: tempId, created_at: new Date().toISOString(), total_visits: 0, total_spent: 0, preferences: null, last_visit: null, notes: null, email: null };
          set(state => ({ clients: [...state.clients, localClient] }));
          get().calculateMetrics();
          return localClient;
        } finally {
          set({ isLoading: false });
        }
      },

      updateClient: async (id, clientData) => {
        try {
          set({ isLoading: true });
          const { id: _, created_at: __, ...updateData } = clientData as any;
          const { data, error } = await supabase.from('clients').update(updateData).eq('id', id).select('*').single();
          if (error) throw error;
          set(state => ({
            clients: state.clients.map(c => c.id === id ? { ...c, ...data } : c),
            lastSync: new Date().toISOString()
          }));
          get().calculateMetrics();
          return true;
        } catch (error) {
          console.error('❌ Error updating client:', error);
          set(state => ({ clients: state.clients.map(c => c.id === id ? { ...c, ...clientData } : c) }));
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteClient: async (id) => {
        try {
          set({ isLoading: true });
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
          console.error('❌ Error deleting client:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // Appointment operations
      addAppointment: async (appointmentData) => {
        try {
          set({ isLoading: true });
          const dataToInsert = { ...appointmentData, status: appointmentData.status || 'scheduled' };
          const { data, error } = await supabase.from('appointments').insert([dataToInsert]).select('*').single();
          if (error) throw error;
          const newAppointment = data as Appointment;
          set(state => ({ appointments: [...state.appointments, newAppointment], lastSync: new Date().toISOString() }));
          get().calculateMetrics();
          return newAppointment;
        } catch (error) {
          console.error('❌ Error adding appointment:', error);
          const tempId = `temp-apt-${Date.now()}`;
          const localAppointment: Appointment = { ...appointmentData, id: tempId, created_at: new Date().toISOString(), status: 'scheduled', payment_method: null, created_via: 'manual', completed_at: null };
          set(state => ({ appointments: [...state.appointments, localAppointment] }));
          get().calculateMetrics();
          return localAppointment;
        } finally {
          set({ isLoading: false });
        }
      },

      updateAppointment: async (id, appointmentData) => {
        try {
          set({ isLoading: true });
          const { id: _, created_at: __, ...updateData } = appointmentData as any;
          const { data, error } = await supabase.from('appointments').update(updateData).eq('id', id).select('*').single();
          if (error) throw error;
          set(state => ({
            appointments: state.appointments.map(a => a.id === id ? { ...a, ...data } : a),
            lastSync: new Date().toISOString()
          }));
          get().calculateMetrics();
          return true;
        } catch (error) {
          console.error('❌ Error updating appointment:', error);
          set(state => ({ appointments: state.appointments.map(a => a.id === id ? { ...a, ...appointmentData } : a) }));
          get().calculateMetrics();
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteAppointment: async (id) => {
        try {
          set({ isLoading: true });
          const { error } = await supabase.from('appointments').delete().eq('id', id);
          if (error) throw error;
          set(state => ({
            appointments: state.appointments.filter(a => a.id !== id),
            lastSync: new Date().toISOString()
          }));
          get().calculateMetrics();
          return true;
        } catch (error) {
          console.error('❌ Error deleting appointment:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      completeAppointment: async (id, paymentMethod, finalPrice) => {
        const appointment = get().appointments.find(a => a.id === id);
        if (!appointment) return false;
        const updates = {
          status: 'completed' as const,
          payment_method: paymentMethod as any,
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
      },

      // Supabase sync functions
      fetchClients: async () => {
        try {
          const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          set({ clients: data || [], lastSync: new Date().toISOString() });
          get().calculateMetrics();
        } catch (error) { console.error('❌ Error fetching clients:', error); }
      },

      fetchAppointments: async () => {
        try {
          const { data, error } = await supabase.from('appointments').select('*').order('scheduled_date', { ascending: false });
          if (error) throw error;
          set({ appointments: data || [], lastSync: new Date().toISOString() });
          get().calculateMetrics();
        } catch (error) { console.error('❌ Error fetching appointments:', error); }
      },

      fetchServices: async () => {
        try {
          const { data, error } = await supabase.from('services').select('*').eq('active', true).order('name');
          if (error) throw error;
          if (data && data.length > 0) {
            set({ services: data, lastSync: new Date().toISOString() });
          }
        } catch (error) { console.error('❌ Error fetching services:', error); }
      },

      syncWithSupabase: async () => {
        set({ isLoading: true });
        try {
          await Promise.all([
            get().fetchClients(),
            get().fetchAppointments(),
            get().fetchServices()
          ]);
        } catch (error) {
          console.error('❌ Error syncing with Supabase:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Computed functions
      // ✅ CORRIGIDO: Usa a função de utilidade robusta para evitar bugs de fuso horário
      getTodaysAppointments: () => {
        const { appointments } = get();
        return getAppointmentsByDate(appointments, new Date());
      },

      getClientById: (id) => get().clients.find(c => c.id === id),

      getRecentClients: () => {
        return get().clients
          .filter(client => client.last_visit)
          .sort((a, b) => new Date(b.last_visit!).getTime() - new Date(a.last_visit!).getTime())
          .slice(0, 10);
      },

      // ✅ CORRIGIDO: Refatorado para usar as funções de utilidade, garantindo consistência e robustez
      calculateMetrics: () => {
        const { appointments } = get();
        
        const todaysAppointments = getAppointmentsByDate(appointments, new Date());
        
        const todayRevenue = todaysAppointments
          .filter(apt => apt.status === 'completed')
          .reduce((sum, apt) => sum + (Number(apt.price) || 0), 0);

        const metrics: DashboardMetrics = {
          todayRevenue,
          todayAppointments: todaysAppointments.length,
          weeklyRevenue: getWeeklyRevenue(appointments),
          monthlyRevenue: getMonthlyRevenue(appointments),
          completedToday: todaysAppointments.filter(apt => apt.status === 'completed').length,
          scheduledToday: todaysAppointments.filter(apt => apt.status !== 'completed' && apt.status !== 'canceled').length,
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
        lastSync: state.lastSync
      }),
    }
  )
);

