// Tipos TypeScript gerados automaticamente pelo Supabase
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string;
          role: 'client' | 'barber' | 'admin';
          avatar_url: string | null;
          is_active: boolean;
          preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone: string;
          role?: 'client' | 'barber' | 'admin';
          avatar_url?: string | null;
          is_active?: boolean;
          preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string;
          role?: 'client' | 'barber' | 'admin';
          avatar_url?: string | null;
          is_active?: boolean;
          preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      barbers: {
        Row: {
          id: string;
          user_id: string;
          specialty: string | null;
          experience_years: number;
          bio: string | null;
          is_available: boolean;
          working_hours: Record<string, any>;
          commission_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          specialty?: string | null;
          experience_years?: number;
          bio?: string | null;
          is_available?: boolean;
          working_hours?: Record<string, any>;
          commission_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          specialty?: string | null;
          experience_years?: number;
          bio?: string | null;
          is_available?: boolean;
          working_hours?: Record<string, any>;
          commission_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          category: string;
          is_active: boolean;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price: number;
          category?: string;
          is_active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number;
          category?: string;
          is_active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          barber_id: string;
          service_id: string;
          appointment_date: string;
          appointment_time: string;
          status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
          notes: string | null;
          created_via: 'whatsapp' | 'manual' | 'online' | 'phone';
          reminder_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          barber_id: string;
          service_id: string;
          appointment_date: string;
          appointment_time: string;
          status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
          notes?: string | null;
          created_via?: 'whatsapp' | 'manual' | 'online' | 'phone';
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          barber_id?: string;
          service_id?: string;
          appointment_date?: string;
          appointment_time?: string;
          status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
          notes?: string | null;
          created_via?: 'whatsapp' | 'manual' | 'online' | 'phone';
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          appointment_id: string;
          amount: number;
          payment_method: 'cash' | 'card' | 'pix' | 'transfer';
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
          paid_at: string | null;
          transaction_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          amount: number;
          payment_method: 'cash' | 'card' | 'pix' | 'transfer';
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          paid_at?: string | null;
          transaction_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          amount?: number;
          payment_method?: 'cash' | 'card' | 'pix' | 'transfer';
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          paid_at?: string | null;
          transaction_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          client_id: string;
          barber_id: string;
          appointment_id: string;
          rating: number;
          comment: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          barber_id: string;
          appointment_id: string;
          rating: number;
          comment?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          barber_id?: string;
          appointment_id?: string;
          rating?: number;
          comment?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_settings: {
        Row: {
          id: string;
          business_name: string;
          business_phone: string | null;
          business_email: string | null;
          address: Record<string, any>;
          working_hours: Record<string, any>;
          settings: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name?: string;
          business_phone?: string | null;
          business_email?: string | null;
          address?: Record<string, any>;
          working_hours?: Record<string, any>;
          settings?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          business_phone?: string | null;
          business_email?: string | null;
          address?: Record<string, any>;
          working_hours?: Record<string, any>;
          settings?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      appointment_details: {
        Row: {
          id: string;
          appointment_date: string;
          appointment_time: string;
          status: string;
          notes: string | null;
          created_via: string;
          client_name: string;
          client_phone: string;
          client_email: string;
          barber_name: string;
          service_name: string;
          duration_minutes: number;
          service_price: number;
          paid_amount: number | null;
          payment_method: string | null;
          payment_status: string | null;
          rating: number | null;
          review_comment: string | null;
        };
      };
      daily_revenue: {
        Row: {
          appointment_date: string;
          total_appointments: number;
          completed_appointments: number;
          potential_revenue: number | null;
          actual_revenue: number | null;
        };
      };
      barber_performance: {
        Row: {
          barber_name: string;
          total_appointments: number;
          completed_appointments: number;
          average_rating: number | null;
          total_revenue: number | null;
        };
      };
    };
    Enums: {
      user_role: 'client' | 'barber' | 'admin';
      appointment_status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
      payment_method: 'cash' | 'card' | 'pix' | 'transfer';
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
      appointment_source: 'whatsapp' | 'manual' | 'online' | 'phone';
    };
  };
};