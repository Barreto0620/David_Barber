import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Tipos auxiliares para facilitar o uso
export type User = Database['public']['Tables']['users']['Row'];
export type Barber = Database['public']['Tables']['barbers']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type BusinessSettings = Database['public']['Tables']['business_settings']['Row'];

export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type BarberInsert = Database['public']['Tables']['barbers']['Insert'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type BarberUpdate = Database['public']['Tables']['barbers']['Update'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];

// Views
export type AppointmentDetails = Database['public']['Views']['appointment_details']['Row'];
export type DailyRevenue = Database['public']['Views']['daily_revenue']['Row'];
export type BarberPerformance = Database['public']['Views']['barber_performance']['Row'];

// Enums
export type UserRole = Database['public']['Enums']['user_role'];
export type AppointmentStatus = Database['public']['Enums']['appointment_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type AppointmentSource = Database['public']['Enums']['appointment_source'];