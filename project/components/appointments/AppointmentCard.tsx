'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Phone, Check, X } from 'lucide-react';
import type { Appointment } from '@/types/database';
import { formatTime, formatCurrency } from '@/lib/utils/currency';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

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
  const getClientById = useAppStore((state) => state.getClientById);
  const client = appointment.client || getClientById(appointment.client_id);

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

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {formatTime(appointment.scheduled_date)}
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