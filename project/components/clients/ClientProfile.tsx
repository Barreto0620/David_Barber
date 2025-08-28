'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Phone, Mail, Calendar, DollarSign, Hash } from 'lucide-react';
import type { Client } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/utils/currency';
import { useAppStore } from '@/lib/store';
import { useMemo } from 'react';

interface ClientProfileProps {
  client: Client;
  onEdit?: (client: Client) => void;
  className?: string;
}

export function ClientProfile({ client, onEdit, className }: ClientProfileProps) {
  const appointments = useAppStore((state) => state.appointments);
  
  const clientStats = useMemo(() => {
    const clientAppointments = appointments.filter(apt => apt.client_id === client.id);
    const completedAppointments = clientAppointments.filter(apt => apt.status === 'completed');
    
    return {
      totalAppointments: clientAppointments.length,
      completedAppointments: completedAppointments.length,
      totalSpent: completedAppointments.reduce((sum, apt) => sum + apt.price, 0),
      lastVisit: completedAppointments.length > 0 
        ? Math.max(...completedAppointments.map(apt => new Date(apt.scheduled_date).getTime()))
        : null,
      favoriteService: clientAppointments.length > 0 
        ? clientAppointments.reduce((prev, current) => 
            clientAppointments.filter(apt => apt.service_type === current.service_type).length >
            clientAppointments.filter(apt => apt.service_type === prev.service_type).length 
              ? current : prev
          ).service_type
        : null,
    };
  }, [appointments, client.id]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{client.name}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3" />
                  <span>{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>{client.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(client)}>
              Editar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total de Visitas</p>
              <p className="font-semibold">{clientStats.totalAppointments}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Gasto Total</p>
              <p className="font-semibold">{formatCurrency(clientStats.totalSpent)}</p>
            </div>
          </div>
        </div>

        {clientStats.lastVisit && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Última Visita</p>
              <p className="font-semibold">{formatDate(new Date(clientStats.lastVisit))}</p>
            </div>
          </div>
        )}

        {clientStats.favoriteService && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Serviço Favorito</p>
            <Badge variant="secondary">{clientStats.favoriteService}</Badge>
          </div>
        )}

        {client.notes && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Observações</p>
            <p className="text-sm bg-muted p-2 rounded-md">{client.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}