// @ts-nocheck
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Phone, CalendarDays, Check, X, Star, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import type { Appointment } from '@/types/database';
import { formatTime, formatCurrency, formatDate } from '@/lib/utils/currency';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface AppointmentCardProps {
  appointment: Appointment;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  className?: string;
}

export function AppointmentCard({ 
  appointment, 
  onComplete, 
  onCancel, 
  className 
}: AppointmentCardProps) {
  const { getClientById, appointments } = useAppStore();
  const client = appointment.client || getClientById(appointment.client_id);

  // Verificar se é agendamento recorrente (verifica nas notas ou se cliente tem schedules)
  const isRecurring = useMemo(() => {
    // Verifica se a nota contém "Recorrente" ou "Cliente Mensal"
    const hasRecurringNote = appointment.notes?.toLowerCase().includes('recorrente') || 
                            appointment.notes?.toLowerCase().includes('cliente mensal');
    
    // Ou verifica se o cliente tem monthly_schedules
    const hasMonthlySchedules = client?.monthly_schedules && client.monthly_schedules.length > 0;
    
    return hasRecurringNote || hasMonthlySchedules;
  }, [appointment.notes, client]);

  // Contar total de visitas do cliente
  const clientVisits = useMemo(() => {
    if (!client) return 0;
    return appointments.filter(apt => apt.client_id === client.id).length;
  }, [client, appointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  // Card normal (não recorrente)
  if (!isRecurring) {
    return (
      <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatTime(appointment.scheduled_date)}
              </span>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatDate(appointment.scheduled_date)}
              </span>
            </div>
            <Badge className={cn('text-white', getStatusColor(appointment.status))}>
              {getStatusText(appointment.status)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{client?.name || 'Cliente não encontrado'}</span>
            </div>
            
            {client?.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{client.phone}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{appointment.service_type}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(appointment.price)}
                </p>
              </div>
              
              {appointment.status === 'scheduled' && (
                <div className="flex space-x-2">
                  {onComplete && (
                    <Button 
                      size="sm" 
                      onClick={() => onComplete(appointment.id)}
                      className="h-8"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {onCancel && (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => onCancel(appointment.id)}
                      className="h-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {appointment.notes && (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                {appointment.notes}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Card PREMIUM para agendamentos recorrentes - com animações e efeitos especiais!
  return (
    <div className={cn('relative group', className)}>
      {/* Brilho animado de fundo */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-lg blur opacity-40 group-hover:opacity-70 animate-pulse transition duration-1000"></div>
      
      {/* Badge flutuante de cliente mensal */}
      <div className="absolute -top-2.5 -right-2.5 z-10 animate-bounce">
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center space-x-1 border-2 border-white">
          <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
          <span>MENSAL</span>
          <Sparkles className="h-3 w-3 animate-pulse" />
        </div>
      </div>

      <Card className="relative border-2 border-purple-300 dark:border-purple-700/50 bg-gradient-to-br from-purple-50/80 via-violet-50/50 to-pink-50/30 dark:from-purple-950/30 dark:via-violet-950/20 dark:to-pink-950/15 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-[1.03] hover:border-purple-400 dark:hover:border-purple-600 hover:-rotate-1">
        
        {/* Padrões decorativos animados */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-400/30 to-transparent rounded-full -mr-24 -mt-24 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-pink-400/30 to-transparent rounded-full -ml-20 -mb-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-transparent rounded-full -ml-16 -mt-16 animate-pulse" style={{ animationDelay: '0.5s' }}></div>

        {/* Estrelas decorativas flutuantes */}
        <div className="absolute top-6 left-6 animate-ping opacity-75">
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
        </div>
        <div className="absolute bottom-8 right-8 animate-ping opacity-75" style={{ animationDelay: '1s' }}>
          <Star className="h-2.5 w-2.5 text-pink-400 fill-pink-400" />
        </div>

        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-lg animate-pulse">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {formatTime(appointment.scheduled_date)}
              </span>
              <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg shadow-lg">
                <CalendarDays className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                {formatDate(appointment.scheduled_date)}
              </span>
            </div>
            <Badge className={cn('text-white shadow-xl animate-pulse', getStatusColor(appointment.status))}>
              {getStatusText(appointment.status)}
            </Badge>
          </div>

          {/* Badge de cliente mensal premium */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 via-violet-100 to-pink-100 dark:from-purple-900/40 dark:via-violet-900/40 dark:to-pink-900/40 px-3 py-2 rounded-xl border-2 border-purple-300 dark:border-purple-700 shadow-md">
            <div className="p-1 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full">
              <RefreshCw className="h-3.5 w-3.5 text-white animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-200">
              Cliente Mensal Premium
            </span>
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 relative z-10">
          <div className="space-y-3">
            {/* Nome do cliente com super destaque */}
            <div className="relative overflow-hidden flex items-center space-x-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-3 rounded-xl border-2 border-purple-300 dark:border-purple-700 group-hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative p-2 bg-gradient-to-br from-purple-500 via-violet-600 to-pink-600 rounded-full shadow-xl">
                <User className="h-5 w-5 text-white" />
              </div>
              <span className="relative font-bold text-lg text-purple-900 dark:text-purple-100">{client?.name || 'Cliente não encontrado'}</span>
            </div>
            
            {client?.phone && (
              <div className="flex items-center space-x-2.5 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-lg border border-purple-200 dark:border-purple-800 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{client.phone}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 p-4 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-lg hover:shadow-xl transition-all">
              <div>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1 flex items-center space-x-1.5">
                  <span>{appointment.service_type}</span>
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
                </p>
                <p className="text-xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {formatCurrency(appointment.price)}
                </p>
              </div>
              
              {appointment.status === 'scheduled' && (
                <div className="flex space-x-2">
                  {onComplete && (
                    <Button 
                      size="sm" 
                      onClick={() => onComplete(appointment.id)}
                      className="h-10 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95"
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                  )}
                  {onCancel && (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => onCancel(appointment.id)}
                      className="h-10 px-4 shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {appointment.notes && (
              <div className="bg-gradient-to-r from-slate-100 via-gray-100 to-slate-100 dark:from-slate-800/70 dark:via-gray-800/70 dark:to-slate-800/70 p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 animate-fade-in shadow-inner">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                  💬 {appointment.notes}
                </p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Barra inferior decorativa super animada */}
        <div className="relative h-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 via-violet-500 to-purple-500 animate-shimmer bg-[length:200%_100%]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-overlay bg-[length:200%_100%]"></div>
        </div>
      </Card>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes shimmer-overlay {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 4s ease-in-out infinite;
        }
        .animate-shimmer-overlay {
          animation: shimmer-overlay 3s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}