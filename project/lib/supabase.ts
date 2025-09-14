import { createClient } from '@supabase/supabase-js';

// Validação das variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não encontradas. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env');
}

// Cliente principal do Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Cliente administrativo (para operações server-side)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

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
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      appointment_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
      payment_method: 'dinheiro' | 'cartao' | 'pix' | 'transferencia';
      created_via: 'whatsapp' | 'manual';
    };
  };
};

// Tipos auxiliares para facilitar o uso
export type Client = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

// Função para verificar conexão
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      return { success: false, message: `Erro na conexão: ${error.message}` };
    }
    
    return { success: true, message: 'Conexão com Supabase estabelecida com sucesso!' };
  } catch (err) {
    return { success: false, message: `Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}` };
  }
}

// Funções utilitárias para operações comuns
export const dbOperations = {
  // Clients
  clients: {
    getAll: () => supabase.from('clients').select('*').order('created_at', { ascending: false }),
    getById: (id: string) => supabase.from('clients').select('*').eq('id', id).single(),
    create: (client: ClientInsert) => supabase.from('clients').insert(client).select().single(),
    update: (id: string, updates: ClientUpdate) => supabase.from('clients').update(updates).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('clients').delete().eq('id', id),
    searchByPhone: (phone: string) => supabase.from('clients').select('*').eq('phone', phone).single(),
  },
  
  // Appointments
  appointments: {
    getAll: () => supabase.from('appointments').select('*').order('scheduled_date', { ascending: true }),
    getById: (id: string) => supabase.from('appointments').select('*').eq('id', id).single(),
    getByDate: (date: string) => supabase.from('appointments').select('*').gte('scheduled_date', date).lt('scheduled_date', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString()),
    getByClient: (clientId: string) => supabase.from('appointments').select('*').eq('client_id', clientId).order('scheduled_date', { ascending: false }),
    create: (appointment: AppointmentInsert) => supabase.from('appointments').insert(appointment).select().single(),
    update: (id: string, updates: AppointmentUpdate) => supabase.from('appointments').update(updates).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('appointments').delete().eq('id', id),
    getUpcoming: () => supabase.from('appointments').select('*').gte('scheduled_date', new Date().toISOString()).eq('status', 'scheduled').order('scheduled_date', { ascending: true }),
  },
  
  // Services
  services: {
    getAll: () => supabase.from('services').select('*').order('name', { ascending: true }),
    getActive: () => supabase.from('services').select('*').eq('active', true).order('name', { ascending: true }),
    getById: (id: string) => supabase.from('services').select('*').eq('id', id).single(),
    create: (service: ServiceInsert) => supabase.from('services').insert(service).select().single(),
    update: (id: string, updates: ServiceUpdate) => supabase.from('services').update(updates).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('services').delete().eq('id', id),
  },
};

// Hook personalizado para real-time subscriptions
export function createRealtimeSubscription<T>(
  table: keyof Database['public']['Tables'],
  callback: (payload: T) => void
) {
  return supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: table as string 
      }, 
      callback
    )
    .subscribe();
}