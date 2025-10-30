'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

interface MonthlyAppointmentsViewProps {
  clientId: string;
  schedules: Array<{
    day_of_week: number;
    time: string;
    service_type: string;
  }>;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function MonthlyAppointmentsView({ clientId, schedules }: MonthlyAppointmentsViewProps) {
  const { appointments } = useAppStore();

  // Busca agendamentos do cliente mensal (próximos 60 dias)
  const clientAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // CORREÇÃO: Define 'hoje' como o início do dia

    const futureLimit = new Date();
    futureLimit.setDate(futureLimit.getDate() + 60);

    return appointments
      .filter(apt => {
        if (apt.client_id !== clientId) return false;
        
        const aptDate = new Date(apt.scheduled_date);
        return aptDate >= today && aptDate <= futureLimit;
      })
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  }, [appointments, clientId]);

  // Agrupa por dia da semana e horário
  const appointmentsBySchedule = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    schedules.forEach(schedule => {
      const key = `${schedule.day_of_week}-${schedule.time}`;
      grouped[key] = [];

      clientAppointments.forEach(apt => {
        const aptDate = new Date(apt.scheduled_date);
        const aptDay = aptDate.getDay();
        const aptTime = aptDate.toTimeString().slice(0, 5);

        if (aptDay === schedule.day_of_week && aptTime === schedule.time) {
          grouped[key].push(apt);
        }
      });
    });

    return grouped;
  }, [schedules, clientAppointments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Concluído
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-blue-500">
            <Clock className="w-3 h-3 mr-1" />
            Agendado
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            Em Andamento
          </Badge>
        );
      default:
        return null;
    }
  };

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum horário recorrente configurado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule, idx) => {
        const key = `${schedule.day_of_week}-${schedule.time}`;
        const appointments = appointmentsBySchedule[key] || [];
        
        return (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{DAYS_OF_WEEK[schedule.day_of_week]}-feira às {schedule.time}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {schedule.service_type}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhum agendamento futuro encontrado
                </div>
              ) : (
                <div className="space-y-2">
                  {appointments.map((apt) => {
                    const aptDate = new Date(apt.scheduled_date);
                    const isPast = aptDate < new Date();
                    
                    return (
                      <div
                        key={apt.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          apt.status === 'completed' && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                          apt.status === 'scheduled' && !isPast && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
                          apt.status === 'cancelled' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
                          isPast && apt.status === 'scheduled' && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                        )}
                     >
                        <div className="flex-1">
                          <div className="font-medium">
                            {aptDate.toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {aptDate.toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                             minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      
                        <div className="flex items-center gap-2">
                          {apt.price > 0 && (
                           <span className="text-sm font-medium text-green-600">
                              R$ {apt.price.toFixed(2)}
                            </span>
                          )}
                         {getStatusBadge(apt.status)}
                     </div>
                      </div>
                    );
                  })}
                </div>
             )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

