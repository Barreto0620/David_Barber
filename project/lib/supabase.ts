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

// ==================== FUNÇÕES DE CALENDÁRIO/AGENDAMENTOS ====================

/**
 * Buscar agendamentos por intervalo de datas
 */
export async function fetchAppointmentsByDateRange(
  startDate: string,
  endDate: string
): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw error;
  }
}

/**
 * Buscar agendamentos de um dia específico
 */
export async function fetchAppointmentsByDate(date: string): Promise<Appointment[]> {
  try {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('scheduled_date', startOfDay)
      .lte('scheduled_date', endOfDay)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos do dia:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos do dia:', error);
    throw error;
  }
}

/**
 * Criar novo agendamento
 */
export async function createAppointment(appointment: {
  client_id?: string;
  scheduled_date: string;
  service_type: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  payment_method?: 'dinheiro' | 'cartao' | 'pix' | 'transferencia';
  created_via: 'whatsapp' | 'manual';
  notes?: string;
}): Promise<Appointment> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        client_id: appointment.client_id || null,
        scheduled_date: appointment.scheduled_date,
        service_type: appointment.service_type,
        status: appointment.status,
        price: appointment.price,
        payment_method: appointment.payment_method || null,
        created_via: appointment.created_via,
        notes: appointment.notes || null,
        completed_at: null
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    throw error;
  }
}

/**
 * Atualizar agendamento existente
 */
export async function updateAppointment(
  id: string,
  updates: Partial<Appointment>
): Promise<Appointment> {
  try {
    // Remover campos que não devem ser atualizados
    const cleanUpdates = { ...updates };
    delete cleanUpdates.id;
    delete cleanUpdates.created_at;
    
    // Se estiver atualizando scheduled_date, verificar conflitos
    if (cleanUpdates.scheduled_date) {
      const { data: conflicts, error: conflictError } = await supabase
        .from('appointments')
        .select('id')
        .eq('scheduled_date', cleanUpdates.scheduled_date)
        .neq('id', id)
        .neq('status', 'cancelled')
        .limit(1);

      if (conflictError) {
        console.error('Erro ao verificar conflitos:', conflictError);
      }

      if (conflicts && conflicts.length > 0) {
        throw new Error('Já existe um agendamento neste horário');
      }
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar agendamento:', error);
      
      // Mensagem mais amigável para erro de constraint
      if (error.code === '23505') {
        throw new Error('Já existe um agendamento neste horário. Escolha outro horário.');
      }
      
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw error;
  }
}

/**
 * Deletar agendamento
 */
export async function deleteAppointment(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar agendamento:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    throw error;
  }
}

/**
 * Atualizar horário do agendamento (para drag and drop)
 */
export async function updateAppointmentTime(
  id: string,
  newScheduledDate: string
): Promise<Appointment> {
  return updateAppointment(id, { scheduled_date: newScheduledDate });
}

/**
 * Buscar cliente por ID (para exibir nome no calendário)
 */
export async function fetchClientById(clientId: string): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return null;
  }
}

/**
 * Buscar todos os clientes (para dropdown ao criar agendamento)
 */
export async function fetchClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    throw error;
  }
}