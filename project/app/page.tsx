// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
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
    setupRealtimeSubscription,
    lastSync
  } = useAppStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [newAppointmentAlert, setNewAppointmentAlert] = useState(false);
  const [previousAppointmentsCount, setPreviousAppointmentsCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🔥 REALTIME: Ativar subscriptions em tempo real
  useEffect(() => {
    console.log('🔴 ATIVANDO REALTIME SUBSCRIPTION...');
    const unsubscribe = setupRealtimeSubscription();

    return () => {
      console.log('🔴 DESATIVANDO REALTIME SUBSCRIPTION...');
      if (unsubscribe) unsubscribe();
    };
  }, [setupRealtimeSubscription]);

  // Inicialização e sync de backup (caso o realtime falhe)
  useEffect(() => {
    const initializeData = async () => {
      console.log('🚀 Dashboard: Inicializando dados...');
      await syncWithSupabase();
    };

    initializeData();

    // Sincronização de backup a cada 5 minutos (o realtime deve ser instantâneo)
    const interval = setInterval(() => {
      console.log('🔄 Dashboard: Sincronização de backup...');
      syncWithSupabase();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [syncWithSupabase]);

  // 🔔 Detectar novos agendamentos e mostrar alerta
  useEffect(() => {
    if (isClient && appointments.length > 0) {
      if (previousAppointmentsCount > 0 && appointments.length > previousAppointmentsCount) {
        console.log('🔔 NOVO AGENDAMENTO DETECTADO!');
        setNewAppointmentAlert(true);
        
        // Tocar um som de notificação (opcional)
        if (typeof Audio !== 'undefined') {
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzbJ7/bRgS0FKHXO8Naathe4');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch (e) {}
        }
        
        // Remover alerta após 5 segundos
        setTimeout(() => setNewAppointmentAlert(false), 5000);
      }
      setPreviousAppointmentsCount(appointments.length);
    }
  }, [appointments.length, isClient, previousAppointmentsCount]);

  // Recalcular métricas quando appointments ou clients mudarem
  useEffect(() => {
    if (isClient && appointments.length > 0) {
      console.log('📊 Dashboard: Recalculando métricas...');
      calculateMetrics();
    }
  }, [appointments, clients, isClient, calculateMetrics]);

  const handleRefresh = async () => {
    console.log('🔄 Dashboard: Refresh manual iniciado...');
    setIsRefreshing(true);
    await syncWithSupabase();
    setIsRefreshing(false);
    console.log('✅ Dashboard: Refresh concluído!');
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
      return <Badge variant="secondary" className="text-xs px-2 py-0.5">0</Badge>;
    }
    return (
      <Badge variant="secondary" className="text-xs px-2 py-0.5">
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

  // Função para buscar nome do cliente de forma segura
  const getClientName = (appointment) => {
    if (!appointment) return 'Cliente';
    
    // Primeiro tenta pegar do relacionamento direto
    if (appointment.client?.name) {
      return appointment.client.name;
    }
    
    // Senão, busca no array de clients pelo ID
    if (appointment.client_id) {
      const client = clients.find(c => c.id === appointment.client_id);
      if (client?.name) {
        return client.name;
      }
    }
    
    return 'Cliente não encontrado';
  };

  if (isLoading && !lastSync) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm sm:text-base text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 10px;
          transition: background 0.2s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
        }

        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
        }

        @keyframes slideInDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideOutUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }

        .alert-enter {
          animation: slideInDown 0.3s ease-out;
        }

        .alert-exit {
          animation: slideOutUp 0.3s ease-in;
        }
      `}</style>

      {/* 🔔 Alerta de Novo Agendamento */}
      {newAppointmentAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 alert-enter">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
            <Bell className="h-5 w-5" />
            <span className="font-semibold">Novo agendamento recebido!</span>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-5 md:space-y-6 p-3 sm:p-4 md:p-6 max-w-[2000px] mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                Visão geral da sua barbearia
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto h-9 sm:h-10"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2", isRefreshing && "animate-spin")} />
              <span className="text-xs sm:text-sm">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-2.5 sm:gap-3 md:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Receita Hoje"
            value={isClient ? metrics.todayRevenue : 0}
            type="currency"
            trend="up"
            trendValue="+12.5% vs ontem"
            icon={<DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
          />

          <MetricCard
            title="Agendamentos Hoje"
            value={isClient ? metrics.todayAppointments : 0}
            trend="up"
            trendValue={isClient ? `${metrics.completedToday} concluídos` : "0 concluídos"}
            icon={<Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
          />

          <MetricCard
            title="Receita Semanal"
            value={isClient ? metrics.weeklyRevenue : 0}
            type="currency"
            trend="neutral"
            icon={<TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          />

          <MetricCard
            title="Total de Clientes"
            value={isClient ? clients.length : 0}
            trend="up"
            trendValue="+3 este mês"
            icon={<Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Left Column - Current/Next Appointment */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4">
            {currentAppointment && (
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold flex items-center gap-1.5 sm:gap-2 px-1">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Atendimento em Andamento</span>
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                    <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 space-y-1.5 sm:space-y-2">
                      <CardTitle className="text-sm sm:text-base flex items-start sm:items-center justify-between gap-2">
                        <span className="truncate flex-1 min-w-0">
                          {getClientName(currentAppointment)}
                        </span>
                        <Badge className={cn(getStatusColor(currentAppointment.status), "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0")}>
                          {getStatusLabel(currentAppointment.status)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm break-words">
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
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold flex items-center gap-1.5 sm:gap-2 px-1">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Próximo Agendamento</span>
                </h3>
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 space-y-1.5 sm:space-y-2">
                    <CardTitle className="text-sm sm:text-base flex items-start sm:items-center justify-between gap-2">
                      <span className="truncate flex-1 min-w-0">
                        {getClientName(nextAppointment)}
                      </span>
                      <Badge className={cn(getStatusColor(nextAppointment.status), "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0")}>
                        {getStatusLabel(nextAppointment.status)}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words">
                      {nextAppointment.service_type} • {formatTime(nextAppointment.scheduled_date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
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
                <CardHeader className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                    <span className="truncate">Sem agendamentos pendentes</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Todos os atendimentos de hoje foram concluídos!
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Right Column - Today's Appointments */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="p-3 sm:p-4 md:p-6 space-y-1.5 sm:space-y-2">
                <CardTitle className="text-sm sm:text-base md:text-lg flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                  <span className="truncate">Agendamentos de Hoje</span>
                  <SafeBadge count={todaysAppointments.length}>total</SafeBadge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {isClient ? `${metrics.completedToday} concluídos • ${metrics.scheduledToday} pendentes` : '0 concluídos • 0 pendentes'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="space-y-2 sm:space-y-2.5 md:space-y-3 max-h-[300px] sm:max-h-[350px] md:max-h-96 overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                  {todaysAppointments.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 md:py-10 text-muted-foreground">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">Nenhum agendamento para hoje</p>
                    </div>
                  ) : (
                    todaysAppointments.map((appointment) => {
                      const service = services.find(s => s.name === appointment.service_type);
                      
                      return (
                        <div
                          key={appointment.id}
                          className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span className="font-medium text-xs sm:text-sm truncate">
                                {getClientName(appointment)}
                              </span>
                              <Badge className={cn(getStatusColor(appointment.status), "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0")}>
                                {getStatusLabel(appointment.status)}
                              </Badge>
                            </div>
                            <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground break-words">
                              {appointment.service_type} • {formatTime(appointment.scheduled_date)}
                              {service && ` • ${service.duration_minutes}min`}
                            </div>
                          </div>
                          <div className="flex xs:flex-col items-center xs:items-end justify-between xs:justify-start gap-1 xs:gap-0.5 flex-shrink-0">
                            <div className="font-medium text-xs sm:text-sm">{formatCurrency(appointment.price)}</div>
                            {appointment.payment_method && (
                              <div className="text-[10px] sm:text-xs text-muted-foreground capitalize">
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

        {/* Bottom Grid - Revenue Chart & Recent Clients */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <RevenueChart />
          </div>

          {/* Recent Clients */}
          <Card className="order-1 lg:order-2">
            <CardHeader className="p-3 sm:p-4 md:p-6 space-y-1.5 sm:space-y-2">
              <CardTitle className="text-sm sm:text-base md:text-lg">Clientes Recentes</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Últimos clientes atendidos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="space-y-2.5 sm:space-y-3 max-h-[250px] sm:max-h-[300px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                {recentClients.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">Nenhum cliente recente</p>
                  </div>
                ) : (
                  recentClients.map((client) => (
                    <div 
                      key={client.id} 
                      className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="font-medium text-xs sm:text-sm truncate">{client.name}</div>
                        {client.last_visit && (
                          <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            Última visita: {new Date(client.last_visit).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <div className="text-xs sm:text-sm font-medium whitespace-nowrap">
                          {client.total_visits} visitas
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
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
    </div>
  );
}