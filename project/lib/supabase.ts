import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          created_at: string;
          last_visit: string | null;
          total_visits: number;
          total_spent: number;
          preferences: Record<string, any> | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          created_at?: string;
          last_visit?: string | null;
          total_visits?: number;
          total_spent?: number;
          preferences?: Record<string, any> | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          created_at?: string;
          last_visit?: string | null;
          total_visits?: number;
          total_spent?: number;
          preferences?: Record<string, any> | null;
          notes?: string | null;
        };
      };
      appointments: {
        Row: {
          id: string;
          client_id: string | null;
          scheduled_date: string;
          service_type: string;
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          price: number;
          payment_method: 'dinheiro' | 'cartao' | 'pix' | 'transferencia' | null;
          created_via: 'whatsapp' | 'manual';
          completed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          scheduled_date: string;
          service_type: string;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          price: number;
          payment_method?: 'dinheiro' | 'cartao' | 'pix' | 'transferencia' | null;
          created_via?: 'whatsapp' | 'manual';
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          scheduled_date?: string;
          service_type?: string;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          price?: number;
          payment_method?: 'dinheiro' | 'cartao' | 'pix' | 'transferencia' | null;
          created_via?: 'whatsapp' | 'manual';
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          price: number;
          duration_minutes: number;
          description: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          duration_minutes: number;
          description?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          duration_minutes?: number;
          description?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
    };
  };
};