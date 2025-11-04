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

  // Card normal (não recorrente) - VISUAL MELHORADO
  if (!isRecurring) {
    return (
      <Card className={cn('transition-all duration-300 hover:shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatTime(appointment.scheduled_date)}
              </span>
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                <CalendarDays className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
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
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{client?.name || 'Cliente não encontrado'}</span>
            </div>
            
            {client?.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">{client.phone}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{appointment.service_type}</p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-500">
                  {formatCurrency(appointment.price)}
                </p>
              </div>
              
              {appointment.status === 'scheduled' && (
                <div className="flex space-x-2">
                  {onComplete && (
                    <Button 
                      size="sm" 
                      onClick={() => onComplete(appointment.id)}
                      className="h-8 bg-green-600 hover:bg-green-700"
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
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded-md">
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
          
        </div>
      </div>

      <Card className="relative border-2 border-purple-300 dark:border-purple-700/50 bg-gradient-to-br from-purple-50/80 via-violet-50/50 to-pink-50/30 dark:from-purple-950/30 dark:via-violet-950/20 dark:to-pink-950/15 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-400 dark:hover:border-purple-600">
        
        {/* Padrões decorativos animados - REDUZIDOS */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full -mr-16 -mt-16 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/20 to-transparent rounded-full -ml-12 -mb-12 animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Estrelas decorativas flutuantes - MENORES */}
        <div className="absolute top-4 left-4 animate-ping opacity-50">
          <Star className="h-2 w-2 text-yellow-400 fill-yellow-400" />
        </div>
        <div className="absolute bottom-6 right-6 animate-ping opacity-50" style={{ animationDelay: '1s' }}>
          <Star className="h-1.5 w-1.5 text-pink-400 fill-pink-400" />
        </div>

        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-md">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {formatTime(appointment.scheduled_date)}
              </span>
              <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg shadow-md">
                <CalendarDays className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                {formatDate(appointment.scheduled_date)}
              </span>
            </div>
            <Badge className={cn('text-white shadow-lg', getStatusColor(appointment.status))}>
              {getStatusText(appointment.status)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 relative z-10">
          <div className="space-y-3">
            {/* Nome do cliente */}
            <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20 p-2 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="p-1 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full shadow-md">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-purple-900 dark:text-purple-100">{client?.name || 'Cliente não encontrado'}</span>
            </div>
            
            {client?.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-muted-foreground">{client.phone}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium flex items-center space-x-1">
                  <span>{appointment.service_type}</span>
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                </p>
                <p className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(appointment.price)}
                </p>
              </div>
              
              {appointment.status === 'scheduled' && (
                <div className="flex space-x-2">
                  {onComplete && (
                    <Button 
                      size="sm" 
                      onClick={() => onComplete(appointment.id)}
                      className="h-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
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
              <p className="text-xs text-muted-foreground bg-purple-50 dark:bg-purple-950/30 p-2 rounded border border-purple-200 dark:border-purple-800">
                {appointment.notes}
              </p>
            )}
          </div>
        </CardContent>

        {/* Barra inferior decorativa animada */}
        <div className="relative h-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 animate-shimmer bg-[length:200%_100%]"></div>
        </div>
      </Card>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}