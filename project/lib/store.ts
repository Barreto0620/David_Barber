// lib/store.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Client, Appointment, Service, DashboardMetrics } from '@/types/database';

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
        { id: '1', name: 'Corte Simples', price: 25, duration_minutes: 30, active: true },
        { id: '2', name: 'Corte + Barba', price: 35, duration_minutes: 45, active: true },
        { id: '3', name: 'Barba', price: 15, duration_minutes: 20, active: true },
        { id: '4', name: 'Corte Especial', price: 40, duration_minutes: 60, active: true },
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
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setLoading: (isLoading) => set({ isLoading }),

      // Client operations
      addClient: async (clientData) => {
        try {
          set({ isLoading: true });
          
          const { data, error } = await supabase
            .from('clients')
            .insert([clientData])
            .select()
            .single();

          if (error) throw error;

          const newClient = data as Client;
          set(state => ({ 
            clients: [...state.clients, newClient],
            lastSync: new Date().toISOString()
          }));
          
          get().calculateMetrics();
          return newClient;
        } catch (error) {
          console.error('Error adding client:', error);
          
          // Fallback to local storage if Supabase fails
          const tempId = `temp-${Date.now()}`;
          const localClient: Client = {
            ...clientData,
            id: tempId,
            created_at: new Date().toISOString(),
            total_visits: 0,
            total_spent: 0
          };
          
          set(state => ({ 
            clients: [...state.clients, localClient]
          }));
          
          return localClient;
        } finally {
          set({ isLoading: false });
        }
      },

      updateClient: async (id, clientData) => {
        try {
          set({ isLoading: true });
          
          const { error } = await supabase
            .from('clients')
            .update(clientData)
            .eq('id', id);

          if (error) throw error;

          set(state => ({
            clients: state.clients.map(client => 
              client.id === id ? { ...client, ...clientData } : client
            ),
            lastSync: new Date().toISOString()
          }));
          
          return true;
        } catch (error) {
          console.error('Error updating client:', error);
          
          // Update locally even if Supabase fails
          set(state => ({
            clients: state.clients.map(client => 
              client.id === id ? { ...client, ...clientData } : client
            )
          }));
          
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
            clients: state.clients.filter(client => client.id !== id),
            appointments: state.appointments.filter(apt => apt.client_id !== id),
            lastSync: new Date().toISOString()
          }));
          
          get().calculateMetrics();
          return true;
        } catch (error) {
          console.error('Error deleting client:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // Appointment operations
      addAppointment: async (appointmentData) => {
        try {
          set({ isLoading: true });
          
          const { data, error } = await supabase
            .from('appointments')
            .insert([appointmentData])
            .select()
            .single();

          if (error) throw error;

          const newAppointment = data as Appointment;
          set(state => ({ 
            appointments: [...state.appointments, newAppointment],
            lastSync: new Date().toISOString()
          }));
          
          get().calculateMetrics();
          return newAppointment;
        } catch (error) {
          console.error('Error adding appointment:', error);
          
          // Fallback to local storage
          const tempId = `temp-${Date.now()}`;
          const localAppointment: Appointment = {
            ...appointmentData,
            id: tempId,
            created_at: new Date().toISOString()
          };
          
          set(state => ({ 
            appointments: [...state.appointments, localAppointment]
          }));
          
          return localAppointment;
        } finally {
          set({ isLoading: false });
        }
      },

      updateAppointment: async (id, appointmentData) => {
        try {
          set({ isLoading: true });
          
          const { error } = await supabase
            .from('appointments')
            .update(appointmentData)
            .eq('id', id);

          if (error) throw error;

          set(state => ({
            appointments: state.appointments.map(appointment => 
              appointment.id === id ? { ...appointment, ...appointmentData } : appointment
            ),
            lastSync: new Date().toISOString()
          }));
          
          get().calculateMetrics();
          return true;
        } catch (error) {
          console.error('Error updating appointment:', error);
          
          // Update locally even if Supabase fails
          set(state => ({
            appointments: state.appointments.map(appointment => 
              appointment.id === id ? { ...appointment, ...appointmentData } : appointment
            )
          }));
          
          get().calculateMetrics();
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
            appointments: state.appointments.filter(appointment => appointment.id !== id),
            lastSync: new Date().toISOString()
          }));
          
          get().calculateMetrics();
          return true;
        } catch (error) {
          console.error('Error deleting appointment:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      completeAppointment: async (id, paymentMethod, finalPrice) => {
        const state = get();
        const appointment = state.appointments.find(a => a.id === id);
        if (!appointment) return false;

        const updates = {
          status: 'completed' as const,
          payment_method: paymentMethod,
          price: finalPrice || appointment.price,
          completed_at: new Date().toISOString(),
        };

        const success = await get().updateAppointment(id, updates);
        
        // Update client statistics
        if (success && appointment.client_id) {
          const client = state.clients.find(c => c.id === appointment.client_id);
          if (client) {
            await get().updateClient(appointment.client_id, {
              total_visits: client.total_visits + 1,
              total_spent: client.total_spent + (finalPrice || appointment.price),
              last_visit: new Date().toISOString()
            });
          }
        }

        return success;
      },

      // Supabase sync functions
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
          console.error('Error fetching clients:', error);
        }
      },

      fetchAppointments: async () => {
        try {
          const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('scheduled_date', { ascending: false });

          if (error) throw error;

          set({ 
            appointments: data || [],
            lastSync: new Date().toISOString()
          });
          
          get().calculateMetrics();
        } catch (error) {
          console.error('Error fetching appointments:', error);
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

          if (data && data.length > 0) {
            set({ 
              services: data,
              lastSync: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error fetching services:', error);
        }
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
          console.error('Error syncing with Supabase:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Computed functions
      getTodaysAppointments: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        return state.appointments.filter(appointment => 
          appointment.scheduled_date.startsWith(today)
        ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
      },

      getClientById: (id) => {
        const state = get();
        return state.clients.find(client => client.id === id);
      },

      getRecentClients: () => {
        const state = get();
        return state.clients
          .filter(client => client.last_visit)
          .sort((a, b) => new Date(b.last_visit!).getTime() - new Date(a.last_visit!).getTime())
          .slice(0, 10);
      },

      calculateMetrics: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const todayAppointments = state.appointments.filter(apt => 
          apt.scheduled_date.startsWith(today)
        );

        const todayRevenue = todayAppointments
          .filter(apt => apt.status === 'completed')
          .reduce((sum, apt) => sum + apt.price, 0);

        const weeklyRevenue = state.appointments
          .filter(apt => 
            new Date(apt.scheduled_date) >= weekAgo && 
            apt.status === 'completed'
          )
          .reduce((sum, apt) => sum + apt.price, 0);

        const monthlyRevenue = state.appointments
          .filter(apt => 
            new Date(apt.scheduled_date) >= monthStart && 
            apt.status === 'completed'
          )
          .reduce((sum, apt) => sum + apt.price, 0);

        const metrics: DashboardMetrics = {
          todayRevenue,
          todayAppointments: todayAppointments.length,
          weeklyRevenue,
          monthlyRevenue,
          completedToday: todayAppointments.filter(apt => apt.status === 'completed').length,
          scheduledToday: todayAppointments.filter(apt => apt.status === 'scheduled').length,
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