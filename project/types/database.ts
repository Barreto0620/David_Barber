// types/database.ts
// Estes são tipos auxiliares para uso no frontend
// Os tipos principais vêm de lib/supabase.ts

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  created_at: string;
  last_visit?: string;
  total_visits: number;
  total_spent: number;
  preferences?: Record<string, any>;
  notes?: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  client?: Client;
  scheduled_date: string;
  service_type: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  payment_method?: string;
  created_via: 'whatsapp' | 'manual';
  completed_at?: string;
  notes?: string;
  started_at?: string;
  actual_duration?: number;
  service_quality_rating?: 1 | 2 | 3 | 4 | 5;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
  active: boolean;
  created_at: string;
}

export interface DashboardMetrics {
  todayRevenue: number;
  todayAppointments: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  completedToday: number;
  scheduledToday: number;
}

export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentMethod = 'dinheiro' | 'cartao' | 'pix' | 'transferencia';

// Clientes Mensais
export interface MonthlyClient {
  id: string;
  client_id: string;
  plan_type: 'basic' | 'premium' | 'vip';
  monthly_price: number;
  start_date: string;
  status: 'active' | 'inactive' | 'suspended';
  payment_status: 'paid' | 'pending' | 'overdue';
  last_payment_date?: string;
  next_payment_date: string;
  total_visits: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlySchedule {
  id: string;
  monthly_client_id: string;
  day_of_week: number;
  time: string;
  service_type: string;
  active: boolean;
  created_at: string;
}

export interface MonthlyClientWithDetails extends MonthlyClient {
  client: Client;
  schedules: MonthlySchedule[];
}