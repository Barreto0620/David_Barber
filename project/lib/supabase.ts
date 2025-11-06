// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Validação
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Variáveis de ambiente do Supabase não encontradas. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env'
  );
}

// Tipagem do banco
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
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clients']['Row']>;
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
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['appointments']['Row']>;
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
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['services']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      appointment_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
      payment_method: 'dinheiro' | 'cartao' | 'pix' | 'transferencia';
      created_via: 'whatsapp' | 'manual';
    };
  };
};

// Cliente principal
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Cliente administrativo
export const supabaseAdmin = supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Tipos auxiliares
export type Client = Database['public']['Tables']['clients']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

// Teste de conexão
export async function testConnection() {
  try {
    const { error } = await supabase.from('services').select('id').limit(1);
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Conexão com Supabase estabelecida com sucesso!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro desconhecido' };
  }
}

// ==================== FUNÇÕES DE SERVIÇOS ====================

/**
 * Buscar todos os serviços
 */
export async function fetchServices(): Promise<Service[]> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar serviços:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    throw error;
  }
}

/**
 * Criar novo serviço
 */
export async function createService(service: {
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
  active: boolean;
}): Promise<Service> {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert([{
        name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes,
        description: service.description || null,
        active: service.active
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar serviço:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    throw error;
  }
}

/**
 * Atualizar serviço existente
 */
export async function updateService(id: string, updates: Partial<Service>): Promise<Service> {
  try {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar serviço:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    throw error;
  }
}

/**
 * Deletar serviço
 */
export async function deleteService(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar serviço:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao deletar serviço:', error);
    throw error;
  }
}

/**
 * Alternar status ativo/inativo
 */
export async function toggleServiceActive(id: string, active: boolean): Promise<Service> {
  return updateService(id, { active });
}