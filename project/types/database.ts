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
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
  active: boolean;
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