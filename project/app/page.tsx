'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { Timer } from '@/components/appointments/Timer';
import { 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Bell
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatTime } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { 
    appointments, 
    clients, 
    services,
    metrics, 
    isLoading,
    getTodaysAppointments,
    getRecentClients,
    syncWithSupabase,
    calculateMetrics,
    lastSync
  } = useAppStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [lastAppointmentCount, setLastAppointmentCount] = useState(0);
  const syncIntervalRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sincronização automática a cada 30 segundos
  useEffect(() => {
    const initializeData = async () => {
      await syncWithSupabase();
    };

    initializeData();

    // Limpa intervalo anterior se existir
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    // Sincroniza a cada 30 segundos
    syncIntervalRef.current = setInterval(() => {
      syncWithSupabase();
    }, 30000); // 30 segundos

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncWithSupabase]);

  // Detecta novos agendamentos e mostra notificação
  useEffect(() => {
    if (!isClient) return;

    const currentCount = appointments.length;
    
    if (lastAppointmentCount > 0 && currentCount > lastAppointmentCount) {
      const newAppointments = currentCount - lastAppointmentCount;
      
      // Mostra notificação
      toast({
        title: "🎉 Novo Agendamento!",
        description: `${newAppointments} ${newAppointments === 1 ? 'novo agendamento chegou' : 'novos agendamentos chegaram'}!`,
        duration: 5000,
      });

      // Notificação do navegador (se permitido)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Novo Agendamento', {
          body: `${newAppointments} ${newAppointments === 1 ? 'novo agendamento' : 'novos agendamentos'}`,
          icon: '/icon.png',
          badge: '/badge.png',
          tag: 'new-appointment',
          requireInteraction: false,
        });
      }

      // Reproduz som de notificação (opcional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Não foi possível reproduzir o som'));
      } catch (e) {
        console.log('Som de notificação não disponível');
      }
    }
    
    setLastAppointmentCount(currentCount);
  }, [appointments.length, isClient, toast, lastAppointmentCount]);

  // Solicita permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await syncWithSupabase();
    setIsRefreshing(false);
    
    toast({
      title: "✓ Atualizado",
      description: "Dados sincronizados com sucesso!",
      duration: 2000,
    });
  };

  const todaysAppointments = isClient ? getTodaysAppointments() : [];
  const recentClients = isClient ? getRecentClients() : [];
  
  const nextAppointment = todaysAppointments
    .filter(apt => apt.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())[0];

  const currentAppointment = todaysAppointments
    .find(apt => apt.status === 'in_progress');

  const SafeBadge = ({ count, children }) => {
    if (!isClient) {
      return <Badge variant="secondary">0</Badge>;
    }
    return (
      <Badge variant="secondary">
        {count} {children}
      </Badge>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (isLoading && !lastSync) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral da sua barbearia
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={cn(
              "h-2 w-2 rounded-full animate-pulse",
              isRefreshing ? "bg-yellow-500" : "bg-green-500"
            )} />
            <span>{isRefreshing ? "Sincronizando..." : "Sincronização automática ativa"}</span>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {lastSync && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bell className="h-3 w-3" />
          <span>Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}</span>
          <span className="mx-2">•</span>
          <span>Próxima em: ~30s</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita Hoje"
          value={isClient ? metrics.todayRevenue : 0}
          type="currency"
          trend="up"
          trendValue="+12.5% vs ontem"
          icon={<DollarSign className="h-4 w-4" />}
          className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
        />
        
        <MetricCard
          title="Agendamentos Hoje"
          value={isClient ? metrics.todayAppointments : 0}
          trend="up"
          trendValue={isClient ? `${metrics.completedToday} concluídos` : "0 concluídos"}
          icon={<Calendar className="h-4 w-4" />}
          className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
        />
        
        <MetricCard
          title="Receita Semanal"
          value={isClient ? metrics.weeklyRevenue : 0}
          type="currency"
          trend="neutral"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Total de Clientes"
          value={isClient ? clients.length : 0}
          trend="up"
          trendValue="+3 este mês"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          {currentAppointment && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Atendimento em Andamento
              </h3>
              <div className="space-y-4">
                <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{clients.find(c => c.id === currentAppointment.client_id)?.name || 'Cliente'}</span>
                      <Badge className={getStatusColor(currentAppointment.status)}>
                        {getStatusLabel(currentAppointment.status)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {currentAppointment.service_type} • {formatTime(currentAppointment.scheduled_date)}
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                <Timer
                  appointment={currentAppointment}
                  serviceDuration={services.find(s => s.name === currentAppointment.service_type)?.duration_minutes || 30}
                />
              </div>
            </div>
          )}

          {nextAppointment && !currentAppointment && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Próximo Agendamento
              </h3>
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{clients.find(c => c.id === nextAppointment.client_id)?.name || 'Cliente'}</span>
                    <Badge className={getStatusColor(nextAppointment.status)}>
                      {getStatusLabel(nextAppointment.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {nextAppointment.service_type} • {formatTime(nextAppointment.scheduled_date)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Timer
                    appointment={nextAppointment}
                    serviceDuration={services.find(s => s.name === nextAppointment.service_type)?.duration_minutes || 30}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {!currentAppointment && !nextAppointment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Sem agendamentos pendentes
                </CardTitle>
                <CardDescription>
                  Todos os atendimentos de hoje foram concluídos!
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Agendamentos de Hoje</span>
                <SafeBadge count={todaysAppointments.length}>total</SafeBadge>
              </CardTitle>
              <CardDescription>
                {isClient ? `${metrics.completedToday} concluídos • ${metrics.scheduledToday} pendentes` : '0 concluídos • 0 pendentes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {todaysAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum agendamento para hoje</p>
                  </div>
                ) : (
                  todaysAppointments.map((appointment) => {
                    const client = clients.find(c => c.id === appointment.client_id);
                    const service = services.find(s => s.name === appointment.service_type);
                    
                    return (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {client?.name || 'Cliente não encontrado'}
                            </span>
                            <Badge className={getStatusColor(appointment.status)}>
                              {getStatusLabel(appointment.status)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.service_type} • {formatTime(appointment.scheduled_date)}
                            {service && ` • ${service.duration_minutes}min`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(appointment.price)}</div>
                          {appointment.payment_method && (
                            <div className="text-xs text-muted-foreground capitalize">
                              {appointment.payment_method}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Clientes Recentes</CardTitle>
            <CardDescription>
              Últimos clientes atendidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum cliente recente</p>
                </div>
              ) : (
                recentClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {client.last_visit && `Última visita: ${new Date(client.last_visit).toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{client.total_visits} visitas</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(client.total_spent)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}