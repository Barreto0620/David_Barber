'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, Appointment, Service, DashboardMetrics } from '@/types/database';

interface AppStore {
  // State
  clients: Client[];
  appointments: Appointment[];
  services: Service[];
  metrics: DashboardMetrics;
  selectedDate: Date;
  isLoading: boolean;

  // Actions
  setClients: (clients: Client[]) => void;
  setAppointments: (appointments: Appointment[]) => void;
  setServices: (services: Service[]) => void;
  setMetrics: (metrics: DashboardMetrics) => void;
  setSelectedDate: (date: Date) => void;
  setLoading: (loading: boolean) => void;
  
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  completeAppointment: (id: string, paymentMethod: string, finalPrice?: number) => void;
  
  // Computed
  getTodaysAppointments: () => Appointment[];
  getClientById: (id: string) => Client | undefined;
  getRecentClients: () => Client[];
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

      // Actions
      setClients: (clients) => set({ clients }),
      setAppointments: (appointments) => set({ appointments }),
      setServices: (services) => set({ services }),
      setMetrics: (metrics) => set({ metrics }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setLoading: (isLoading) => set({ isLoading }),

      addClient: (client) => set((state) => ({ 
        clients: [...state.clients, client] 
      })),

      updateClient: (id, clientData) => set((state) => ({
        clients: state.clients.map(client => 
          client.id === id ? { ...client, ...clientData } : client
        )
      })),

      addAppointment: (appointment) => set((state) => ({ 
        appointments: [...state.appointments, appointment] 
      })),

      updateAppointment: (id, appointmentData) => set((state) => ({
        appointments: state.appointments.map(appointment => 
          appointment.id === id ? { ...appointment, ...appointmentData } : appointment
        )
      })),

      completeAppointment: (id, paymentMethod, finalPrice) => {
        const state = get();
        const appointment = state.appointments.find(a => a.id === id);
        if (!appointment) return;

        const updatedAppointment = {
          ...appointment,
          status: 'completed' as const,
          payment_method: paymentMethod,
          price: finalPrice || appointment.price,
          completed_at: new Date().toISOString(),
        };

        set({
          appointments: state.appointments.map(a => 
            a.id === id ? updatedAppointment : a
          )
        });
      },

      // Computed
      getTodaysAppointments: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        return state.appointments.filter(appointment => 
          appointment.scheduled_date.startsWith(today)
        );
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
    }),
    {
      name: 'david-barber-store',
      partialize: (state) => ({
        clients: state.clients,
        appointments: state.appointments,
        services: state.services,
      }),
    }
  )
);