// lib/utils/appointments.ts
import type { Appointment } from '@/types/database';

// Função auxiliar para converter diversos tipos de data em Date válida
// Nenhuma alteração necessária aqui, está robusta.
const parseToDate = (dateInput: any): Date | null => {
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput;
  }
  if (typeof dateInput === 'string' && dateInput.trim()) {
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  if (typeof dateInput === 'number' && !isNaN(dateInput)) {
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
};

// Função para formatar data no formato YYYY-MM-DD de forma segura
// Nenhuma alteração necessária aqui.
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ✅ CORRIGIDO: Lógica de comparação de datas refeita para ser imune a timezones.
export const getAppointmentsByDate = (appointments: Appointment[], dateInput: any): Appointment[] => {
  try {
    const selectedDate = parseToDate(dateInput);
    
    if (!selectedDate) {
      console.error("❌ Erro: data de entrada inválida:", dateInput);
      return [];
    }
    
    // Define o intervalo de um dia inteiro (00:00:00 até 23:59:59) no fuso horário local
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`🔍 Filtrando agendamentos para ${formatDateToString(selectedDate)}`);
    
    const filteredAppointments = appointments.filter(appointment => {
      if (!appointment.scheduled_date) {
        return false;
      }
      
      const appointmentDate = parseToDate(appointment.scheduled_date);
      
      // Compara se o momento do agendamento está dentro do dia selecionado
      return appointmentDate && appointmentDate >= startOfDay && appointmentDate <= endOfDay;
    });
    
    console.log(`📅 Encontrados ${filteredAppointments.length} agendamentos.`);
    
    return filteredAppointments.sort((a, b) => 
      new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    );
    
  } catch (error) {
    console.error('❌ Erro em getAppointmentsByDate:', error);
    return [];
  }
};

export const getAppointmentsByStatus = (appointments: Appointment[], status: string): Appointment[] => {
  try {
    if (!Array.isArray(appointments)) return [];
    if (!status || typeof status !== 'string') return [];
    
    return appointments.filter(appointment => appointment?.status === status);
    
  } catch (error) {
    console.error('❌ Erro em getAppointmentsByStatus:', error);
    return [];
  }
};

// ✅ CORRIGIDO: Lógica de receita de hoje refeita para ser imune a timezones.
export const getTodaysRevenue = (appointments: Appointment[]): number => {
  try {
    if (!Array.isArray(appointments)) return 0;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    return appointments
      .filter(appointment => {
        if (appointment.status !== 'completed' || !appointment.scheduled_date) {
          return false;
        }
        const appointmentDate = parseToDate(appointment.scheduled_date);
        return appointmentDate && appointmentDate >= todayStart && appointmentDate <= todayEnd;
      })
      .reduce((total, appointment) => total + (Number(appointment.price) || 0), 0);
    
  } catch (error) {
    console.error('❌ Erro em getTodaysRevenue:', error);
    return 0;
  }
};

// Esta função já usava uma lógica correta, sem necessidade de alteração.
export const getWeeklyRevenue = (appointments: Appointment[]): number => {
  try {
    if (!Array.isArray(appointments)) return 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    
    return appointments
      .filter(appointment => {
        if (appointment.status !== 'completed' || !appointment.scheduled_date) {
          return false;
        }
        const appointmentDate = parseToDate(appointment.scheduled_date);
        return appointmentDate && appointmentDate >= oneWeekAgo;
      })
      .reduce((total, appointment) => total + (Number(appointment.price) || 0), 0);
    
  } catch (error) {
    console.error('❌ Erro em getWeeklyRevenue:', error);
    return 0;
  }
};

// Esta função também já usava uma lógica correta, sem necessidade de alteração.
export const getMonthlyRevenue = (appointments: Appointment[]): number => {
  try {
    if (!Array.isArray(appointments)) return 0;
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    return appointments
      .filter(appointment => {
        if (appointment.status !== 'completed' || !appointment.scheduled_date) {
          return false;
        }
        const appointmentDate = parseToDate(appointment.scheduled_date);
        return appointmentDate && appointmentDate >= firstDayOfMonth;
      })
      .reduce((total, appointment) => total + (Number(appointment.price) || 0), 0);
    
  } catch (error) {
    console.error('❌ Erro em getMonthlyRevenue:', error);
    return 0;
  }
};

// Funções restantes não precisam de alteração
export const isValidAppointment = (appointment: any): appointment is Appointment => {
  return (
    appointment &&
    typeof appointment === 'object' &&
    typeof appointment.id === 'string' &&
    typeof appointment.scheduled_date === 'string' &&
    typeof appointment.service_type === 'string' &&
    typeof appointment.price === 'number' &&
    typeof appointment.status === 'string'
  );
};

export const filterValidAppointments = (appointments: any[]): Appointment[] => {
  if (!Array.isArray(appointments)) {
    return [];
  }
  return appointments.filter(isValidAppointment);
};

export const getAppointmentsByDateRange = (
  appointments: Appointment[], 
  startDate: any, 
  endDate: any
): Appointment[] => {
  try {
    const start = parseToDate(startDate);
    const end = parseToDate(endDate);
    
    if (!start || !end) return [];
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return appointments
      .filter(appointment => {
        const appointmentDate = parseToDate(appointment.scheduled_date);
        return appointmentDate && appointmentDate >= start && appointmentDate <= end;
      })
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
      
  } catch (error) {
    console.error('❌ Erro em getAppointmentsByDateRange:', error);
    return [];
  }
};

export const groupAppointmentsByDate = (appointments: Appointment[]): Record<string, Appointment[]> => {
  try {
    const grouped: Record<string, Appointment[]> = {};
    
    appointments.forEach(appointment => {
      if (!appointment?.scheduled_date) return;
      
      // Para agrupar, convertemos para a data local primeiro
      const appointmentDate = parseToDate(appointment.scheduled_date);
      if (!appointmentDate) return;

      const dateKey = formatDateToString(appointmentDate);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });
    
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => 
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      );
    });
    
    return grouped;
    
  } catch (error) {
    console.error('❌ Erro em groupAppointmentsByDate:', error);
    return {};
  }
};
