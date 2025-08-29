// lib/utils/appointments.ts
import type { Appointment } from '@/types/database';

export const getAppointmentsByDate = (appointments: Appointment[], date: Date): Appointment[] => {
  // Verifica se a variável 'date' é uma instância de Date e se é uma data válida.
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error("Erro: 'date' não é uma instância de Date válida.");
    return []; // Retorna um array vazio para evitar o erro.
  }

  const targetDate = date.toISOString().split('T')[0];
  return appointments.filter(appointment =>
    appointment.scheduled_date.startsWith(targetDate)
  ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
};

export const getAppointmentsByStatus = (appointments: Appointment[], status: string): Appointment[] => {
  return appointments.filter(appointment => appointment.status === status);
};

export const getTodaysRevenue = (appointments: Appointment[]): number => {
  const today = new Date().toISOString().split('T')[0];
  return appointments
    .filter(appointment =>
      appointment.scheduled_date.startsWith(today) &&
      appointment.status === 'completed'
    )
    .reduce((total, appointment) => total + appointment.price, 0);
};

export const getWeeklyRevenue = (appointments: Appointment[]): number => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return appointments
    .filter(appointment =>
      new Date(appointment.scheduled_date) >= oneWeekAgo &&
      appointment.status === 'completed'
    )
    .reduce((total, appointment) => total + appointment.price, 0);
};

export const getMonthlyRevenue = (appointments: Appointment[]): number => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return appointments
    .filter(appointment =>
      new Date(appointment.scheduled_date) >= firstDayOfMonth &&
      appointment.status === 'completed'
    )
    .reduce((total, appointment) => total + appointment.price, 0);
};