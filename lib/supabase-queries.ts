import { supabase } from './supabase-client';
import type { 
  User, 
  Barber, 
  Service, 
  Appointment, 
  Payment, 
  Review,
  AppointmentInsert,
  PaymentInsert,
  ReviewInsert,
  AppointmentDetails,
  DailyRevenue,
  BarberPerformance
} from './supabase-client';

// ===== USER QUERIES =====
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
};

// ===== BARBER QUERIES =====
export const getAvailableBarbers = async () => {
  const { data, error } = await supabase
    .from('barbers')
    .select(`
      *,
      users (
        id,
        name,
        email,
        phone,
        avatar_url
      ),
      barber_services (
        services (
          id,
          name,
          price,
          duration_minutes
        )
      )
    `)
    .eq('is_available', true);
  
  return { data, error };
};

export const getBarberById = async (barberId: string) => {
  const { data, error } = await supabase
    .from('barbers')
    .select(`
      *,
      users (
        id,
        name,
        email,
        phone,
        avatar_url
      ),
      barber_services (
        services (
          id,
          name,
          price,
          duration_minutes,
          description
        )
      )
    `)
    .eq('id', barberId)
    .single();
  
  return { data, error };
};

// ===== SERVICE QUERIES =====
export const getActiveServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  
  return { data, error };
};

export const getServicesByCategory = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  
  if (error) return { data: null, error };
  
  // Agrupar por categoria
  const servicesByCategory = data?.reduce((acc, service) => {
    const category = service.category || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);
  
  return { data: servicesByCategory, error: null };
};

// ===== APPOINTMENT QUERIES =====
export const createAppointment = async (appointment: AppointmentInsert) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointment])
    .select(`
      *,
      users!appointments_client_id_fkey (
        id,
        name,
        phone,
        email
      ),
      barbers (
        id,
        users (
          name
        )
      ),
      services (
        id,
        name,
        price,
        duration_minutes
      )
    `)
    .single();
  
  return { data, error };
};

export const getAppointmentsByDate = async (date: string, barberId?: string) => {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      users!appointments_client_id_fkey (
        id,
        name,
        phone,
        email
      ),
      barbers (
        id,
        users (
          name
        )
      ),
      services (
        id,
        name,
        price,
        duration_minutes
      )
    `)
    .eq('appointment_date', date)
    .order('appointment_time', { ascending: true });
  
  if (barberId) {
    query = query.eq('barber_id', barberId);
  }
  
  const { data, error } = await query;
  return { data, error };
};

export const getClientAppointments = async (clientId: string, limit = 10) => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      barbers (
        id,
        users (
          name
        )
      ),
      services (
        id,
        name,
        price,
        duration_minutes
      ),
      payments (
        id,
        amount,
        payment_method,
        payment_status
      )
    `)
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false })
    .limit(limit);
  
  return { data, error };
};

export const updateAppointmentStatus = async (
  appointmentId: string, 
  status: AppointmentStatus,
  notes?: string
) => {
  const updates: any = { status };
  if (notes) updates.notes = notes;
  
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select()
    .single();
  
  return { data, error };
};

// ===== PAYMENT QUERIES =====
export const createPayment = async (payment: PaymentInsert) => {
  const { data, error } = await supabase
    .from('payments')
    .insert([payment])
    .select()
    .single();
  
  return { data, error };
};

export const updatePaymentStatus = async (
  paymentId: string, 
  status: PaymentStatus,
  transactionId?: string
) => {
  const updates: any = { 
    payment_status: status,
    paid_at: status === 'completed' ? new Date().toISOString() : null
  };
  
  if (transactionId) updates.transaction_id = transactionId;
  
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single();
  
  return { data, error };
};

// ===== REVIEW QUERIES =====
export const createReview = async (review: ReviewInsert) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert([review])
    .select(`
      *,
      users!reviews_client_id_fkey (
        name,
        avatar_url
      )
    `)
    .single();
  
  return { data, error };
};

export const getBarberReviews = async (barberId: string, limit = 10) => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      users!reviews_client_id_fkey (
        name,
        avatar_url
      )
    `)
    .eq('barber_id', barberId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { data, error };
};

// ===== ANALYTICS QUERIES =====
export const getDailyRevenue = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('daily_revenue')
    .select('*')
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate)
    .order('appointment_date', { ascending: true });
  
  return { data, error };
};

export const getBarberPerformance = async () => {
  const { data, error } = await supabase
    .from('barber_performance')
    .select('*');
  
  return { data, error };
};

export const getAppointmentDetails = async (appointmentId?: string) => {
  let query = supabase
    .from('appointment_details')
    .select('*');
  
  if (appointmentId) {
    query = query.eq('id', appointmentId).single();
  } else {
    query = query.order('appointment_date', { ascending: false })
                  .order('appointment_time', { ascending: false });
  }
  
  const { data, error } = await query;
  return { data, error };
};

// ===== DASHBOARD QUERIES =====
export const getDashboardMetrics = async (barberId?: string) => {
  const today = new Date().toISOString().split('T')[0];
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekStart = startOfWeek.toISOString().split('T')[0];
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const monthStart = startOfMonth.toISOString().split('T')[0];
  
  // Query base para appointments
  let appointmentsQuery = supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      status,
      services (price),
      payments (amount, payment_status)
    `);
  
  if (barberId) {
    appointmentsQuery = appointmentsQuery.eq('barber_id', barberId);
  }
  
  const { data: appointments, error } = await appointmentsQuery;
  
  if (error) return { data: null, error };
  
  // Calcular métricas
  const todayAppointments = appointments?.filter(apt => apt.appointment_date === today) || [];
  const weekAppointments = appointments?.filter(apt => apt.appointment_date >= weekStart) || [];
  const monthAppointments = appointments?.filter(apt => apt.appointment_date >= monthStart) || [];
  
  const todayRevenue = todayAppointments
    .filter(apt => apt.status === 'completed')
    .reduce((sum, apt) => {
      const payment = apt.payments?.[0];
      return sum + (payment?.payment_status === 'completed' ? payment.amount : 0);
    }, 0);
  
  const weeklyRevenue = weekAppointments
    .filter(apt => apt.status === 'completed')
    .reduce((sum, apt) => {
      const payment = apt.payments?.[0];
      return sum + (payment?.payment_status === 'completed' ? payment.amount : 0);
    }, 0);
  
  const monthlyRevenue = monthAppointments
    .filter(apt => apt.status === 'completed')
    .reduce((sum, apt) => {
      const payment = apt.payments?.[0];
      return sum + (payment?.payment_status === 'completed' ? payment.amount : 0);
    }, 0);
  
  return {
    data: {
      todayAppointments: todayAppointments.length,
      todayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      completedToday: todayAppointments.filter(apt => apt.status === 'completed').length,
      scheduledToday: todayAppointments.filter(apt => apt.status === 'scheduled').length,
      confirmedToday: todayAppointments.filter(apt => apt.status === 'confirmed').length,
    },
    error: null
  };
};

// ===== BUSINESS SETTINGS =====
export const getBusinessSettings = async () => {
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .single();
  
  return { data, error };
};

export const updateBusinessSettings = async (settings: Partial<BusinessSettings>) => {
  const { data, error } = await supabase
    .from('business_settings')
    .update(settings)
    .select()
    .single();
  
  return { data, error };
};