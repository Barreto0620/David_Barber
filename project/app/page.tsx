'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { ServiceCompletionModal } from '@/components/appointments/ServiceCompletionModal';
import { NewAppointmentModal } from '@/components/forms/NewAppointmentModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Users,
  Clock,
  CheckCircle,
  Plus
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils/currency';
import { getTodaysRevenue, getWeeklyRevenue, getMonthlyRevenue } from '@/lib/utils/appointments';
import type { Appointment, PaymentMethod } from '@/types/database';
import { toast } from 'sonner';

export default function Dashboard() {
  const {
    appointments,
    clients,
    services,
    getTodaysAppointments,
    completeAppointment,
    addAppointment,
    addClient
  } = useAppStore();

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [newAppointmentModalOpen, setNewAppointmentModalOpen] = useState(false);

  // Initialize with sample data if empty
  useEffect(() => {
    if (clients.length === 0) {
      // Sample clients
      const sampleClients = [
        { 
          id: '1', 
          name: 'João Silva', 
          phone: '(11) 99999-1111', 
          email: 'joao@email.com',
          created_at: new Date().toISOString(),
          total_visits: 12,
          total_spent: 420,
          last_visit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Prefere corte clássico'
        },
        { 
          id: '2', 
          name: 'Carlos Santos', 
          phone: '(11) 99999-2222',
          created_at: new Date().toISOString(),
          total_visits: 8,
          total_spent: 280,
          last_visit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        { 
          id: '3', 
          name: 'Pedro Oliveira', 
          phone: '(11) 99999-3333',
          created_at: new Date().toISOString(),
          total_visits: 5,
          total_spent: 175,
          last_visit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      sampleClients.forEach(client => addClient(client));

      // Sample appointments for today
      const today = new Date();
      const sampleAppointments = [
        {
          id: '1',
          client_id: '1',
          scheduled_date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
          service_type: 'Corte + Barba',
          status: 'completed' as const,
          price: 35,
          payment_method: 'dinheiro',
          created_via: 'whatsapp' as const,
          completed_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 45).toISOString()
        },
        {
          id: '2',
          client_id: '2',
          scheduled_date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 30).toISOString(),
          service_type: 'Corte Simples',
          status: 'scheduled' as const,
          price: 25,
          created_via: 'manual' as const
        },
        {
          id: '3',
          client_id: '3',
          scheduled_date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(),
          service_type: 'Barba',
          status: 'scheduled' as const,
          price: 15,
          created_via: 'whatsapp' as const
        }
      ];

      sampleAppointments.forEach(appointment => addAppointment(appointment));
    }
  }, [clients.length, addClient, addAppointment]);

  const todaysAppointments = getTodaysAppointments();
  const todayRevenue = getTodaysRevenue(appointments);
  const weeklyRevenue = getWeeklyRevenue(appointments);
  const monthlyRevenue = getMonthlyRevenue(appointments);
  
  const todayCompleted = todaysAppointments.filter(apt => apt.status === 'completed').length;
  const todayScheduled = todaysAppointments.filter(apt => apt.status === 'scheduled').length;

  const handleCompleteAppointment = (id: string) => {
    const appointment = appointments.find(apt => apt.id === id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setCompletionModalOpen(true);
    }
  };

  const handleServiceCompletion = (paymentMethod: PaymentMethod, finalPrice: number, notes?: string) => {
    if (!selectedAppointment) return;
    
    completeAppointment(selectedAppointment.id, paymentMethod, finalPrice);
    toast.success('Atendimento finalizado com sucesso!');
    
    setSelectedAppointment(null);
    setCompletionModalOpen(false);
  };

  const handleCancelAppointment = (id: string) => {
    // Implementation would update appointment status to cancelled
    toast.info('Agendamento cancelado');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da barbearia David Barber
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setNewAppointmentModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita de Hoje"
          value={todayRevenue}
          type="currency"
          icon={<DollarSign className="h-4 w-4" />}
          trend="up"
          trendValue="+12% vs ontem"
        />
        <MetricCard
          title="Agendamentos Hoje"
          value={todaysAppointments.length}
          icon={<Calendar className="h-4 w-4" />}
          trend="neutral"
          trendValue={`${todayCompleted} concluídos`}
        />
        <MetricCard
          title="Receita Semanal"
          value={weeklyRevenue}
          type="currency"
          icon={<TrendingUp className="h-4 w-4" />}
          trend="up"
          trendValue="+8% vs semana passada"
        />
        <MetricCard
          title="Clientes Ativos"
          value={clients.length}
          icon={<Users className="h-4 w-4" />}
          trend="up"
          trendValue="+3 novos este mês"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RevenueChart />
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status de Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Agendados</span>
              </div>
              <Badge variant="secondary">{todayScheduled}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Concluídos</span>
              </div>
              <Badge variant="secondary">{todayCompleted}</Badge>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Taxa de Conclusão</span>
                <span className="font-bold">
                  {todaysAppointments.length > 0 
                    ? Math.round((todayCompleted / todaysAppointments.length) * 100)
                    : 0
                  }%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {todaysAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum agendamento para hoje
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todaysAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onComplete={handleCompleteAppointment}
                  onCancel={handleCancelAppointment}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ServiceCompletionModal
        appointment={selectedAppointment}
        open={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        onComplete={handleServiceCompletion}
      />

      <NewAppointmentModal
        open={newAppointmentModalOpen}
        onClose={() => setNewAppointmentModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}