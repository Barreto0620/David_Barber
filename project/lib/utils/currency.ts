// @ts-nocheck
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) {
    return 'Data Inválida';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatTime = (date: string | Date | undefined | null): string => {
  if (!date) {
    return 'Horário Inválido';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date | undefined | null): string => {
  if (!date) {
    return 'Data e Hora Inválidas';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};