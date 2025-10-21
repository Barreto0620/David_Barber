'use client';

import { useState, useMemo, useEffect } from 'react';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { ServiceCompletionModal } from '@/components/appointments/ServiceCompletionModal';
import { NewAppointmentModal } from '@/components/forms/NewAppointmentModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Plus, Filter, Scissors, AlertTriangle, Search, X, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getAppointmentsByDate, getAppointmentsByStatus } from '@/lib/utils/appointments';
import type { Appointment, PaymentMethod, AppointmentStatus } from '@/types/database';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/currency';

export default function AppointmentsPage() {
  const { 
    appointments, 
    clients,
    selectedDate: selectedDateFromStore, 
    setSelectedDate,
    completeAppointment,
    cancelAppointment,
    getClientById,
    addNotification, // <- ADICIONADO
  } = useAppStore();

  // Garantir que selectedDate seja sempre um objeto Date
  const selectedDate = selectedDateFromStore instanceof Date 
    ? selectedDateFromStore 
    : new Date(selectedDateFromStore);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [newAppointmentModalOpen, setNewAppointmentModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'daily' | 'all'>('daily');
  
  // Estados para busca e filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ===== SISTEMA DE LEMBRETES AUTOMÁTICOS (NOVO) =====
  useEffect(() => {
    const checkUpcomingAppointments = () => {
      const now = new Date();
      
      appointments.forEach(apt => {
        // Só processa agendamentos agendados (não completados/cancelados)
        if (apt.status !== 'scheduled') return;
        
        const scheduledDate = new Date(apt.scheduled_date);
        
        // Calcula diferença em minutos
        const diffMinutes = Math.round((scheduledDate.getTime() - now.getTime()) / (1000 * 60));
        
        // Cria lembretes em momentos específicos: 30, 15 e 5 minutos antes
        if (diffMinutes === 30 || diffMinutes === 15 || diffMinutes === 5) {
          const client = apt.client || getClientById(apt.client_id);
          
          addNotification({
            type: 'reminder',
            title: '⏰ Lembrete de Agendamento',
            message: `${client?.name || 'Cliente'} tem agendamento em ${diffMinutes} minutos`,
            appointmentId: apt.id,
            clientName: client?.name || 'Cliente',
            serviceType: apt.service_type,
            scheduledDate: apt.scheduled_date,
          });
          
          console.log(`📢 Lembrete criado: ${client?.name} em ${diffMinutes} minutos`);
        }
        
        // Notificação quando o agendamento está atrasado (5 minutos após o horário)
        if (diffMinutes === -5) {
          const client = apt.client || getClientById(apt.client_id);
          
          addNotification({
            type: 'reminder',
            title: '⚠️ Agendamento Atrasado',
            message: `O agendamento de ${client?.name || 'Cliente'} está 5 minutos atrasado`,
            appointmentId: apt.id,
            clientName: client?.name || 'Cliente',
            serviceType: apt.service_type,
            scheduledDate: apt.scheduled_date,
          });
        }
      });
    };

    // Verifica imediatamente ao carregar
    checkUpcomingAppointments();
    
    // Configura verificação automática a cada 1 minuto
    const interval = setInterval(checkUpcomingAppointments, 60000);
    
    // Limpa o interval quando o componente for desmontado
    return () => clearInterval(interval);
  }, [appointments, addNotification, getClientById]);
  // ===== FIM DO SISTEMA DE LEMBRETES =====

  // Lógica para definir a lista de agendamentos a ser exibida
  const displayAppointments = viewMode === 'all' 
    ? appointments 
    : getAppointmentsByDate(appointments, selectedDate);
  
  // Obter lista única de serviços para o filtro
  const uniqueServices = useMemo(() => {
    const services = new Set(appointments.map(apt => apt.service_type));
    return Array.from(services).sort();
  }, [appointments]);
  
  // Obter lista única de datas para o filtro
  const uniqueDates = useMemo(() => {
    const dates = new Set(
      appointments.map(apt => {
        const date = new Date(apt.scheduled_date);
        return date.toISOString().split('T')[0];
      })
    );
    return Array.from(dates).sort().reverse();
  }, [appointments]);
  
  // Função para filtrar por range de data
  const filterByDateRange = (apt: Appointment) => {
    if (filterDateRange === 'all') return true;
    
    const aptDate = new Date(apt.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filterDateRange) {
      case 'recent':
        const now = new Date();
        return aptDate >= now;
      
      case 'today':
        const todayStr = today.toISOString().split('T')[0];
        const aptStr = aptDate.toISOString().split('T')[0];
        return todayStr === aptStr;
      
      case 'week':
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        return aptDate >= today && aptDate <= weekFromNow;
      
      case 'month':
        const monthFromNow = new Date(today);
        monthFromNow.setMonth(today.getMonth() + 1);
        return aptDate >= today && aptDate <= monthFromNow;
      
      default:
        return true;
    }
  };
  
  // Aplicar busca e filtros
  const filteredAppointments = useMemo(() => {
    let filtered = activeTab === 'all' 
      ? displayAppointments 
      : getAppointmentsByStatus(displayAppointments, activeTab);
    
    // Filtro de busca por nome do cliente ou serviço
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt => {
        const client = apt.client || (apt.client_id ? getClientById(apt.client_id) : null);
        const clientName = client?.name?.toLowerCase() || '';
        const serviceName = apt.service_type?.toLowerCase() || '';
        
        return clientName.includes(query) || serviceName.includes(query);
      });
    }
    
    // Filtro por serviço
    if (filterService !== 'all') {
      filtered = filtered.filter(apt => apt.service_type === filterService);
    }
    
    // Filtro por range de data
    filtered = filtered.filter(filterByDateRange);
    
    return filtered;
  }, [displayAppointments, activeTab, searchQuery, filterService, filterDateRange, getClientById]);

  const getStatusCount = (status: AppointmentStatus) => {
    return getAppointmentsByStatus(displayAppointments, status).length;
  };
  
  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterService('all');
    setFilterDateRange('all');
  };
  
  const hasActiveFilters = searchQuery || filterService !== 'all' || filterDateRange !== 'all';

  const handleCompleteAppointment = (id: string) => {
    const appointment = appointments.find(apt => apt.id === id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setCompletionModalOpen(true);
    }
  };

  const handleServiceCompletion = async (paymentMethod: PaymentMethod, finalPrice: number, notes?: string) => {
    if (!selectedAppointment) return;
    
    const success = await completeAppointment(selectedAppointment.id, paymentMethod, finalPrice);
    
    if (success) {
      toast.success('Atendimento finalizado com sucesso!');
      setSelectedAppointment(null);
      setCompletionModalOpen(false);
    } else {
      toast.error('Erro ao finalizar atendimento. Tente novamente.');
    }
  };

  const handleCancelAppointment = (id: string) => {
    setAppointmentToCancel(id);
    setCancelDialogOpen(true);
  };

  const confirmCancelAppointment = async () => {
    if (appointmentToCancel) {
      const success = await cancelAppointment(appointmentToCancel);
      
      if (success) {
        toast.success('Agendamento cancelado com sucesso!');
        setAppointmentToCancel(null);
        setCancelDialogOpen(false);
      } else {
        toast.error('Erro ao cancelar agendamento. Tente novamente.');
      }
    }
  };

  const getCancelAppointmentDetails = () => {
    if (!appointmentToCancel) return null;
    
    const appointment = appointments.find(apt => apt.id === appointmentToCancel);
    if (!appointment) return null;

    const client = appointment.client || (appointment.client_id ? getClientById(appointment.client_id) : null);
    const clientName = client?.name || 'Cliente não identificado';

    const scheduledDate = new Date(appointment.scheduled_date);
    const dateStr = scheduledDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = scheduledDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      clientName,
      serviceName: appointment.service_type || 'Serviço não especificado',
      date: dateStr,
      time: timeStr,
      dateTime: `${dateStr} às ${timeStr}`
    };
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie todos os agendamentos da barbearia
          </p>
        </div>
        <Button onClick={() => setNewAppointmentModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Barra de Busca e Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Barra de Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou serviço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Botão de Filtros */}
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {hasActiveFilters && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center" variant="destructive">
                      !
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Filtros Avançados</h4>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-8 px-2 text-xs"
                      >
                        Limpar tudo
                      </Button>
                    )}
                  </div>

                  {/* Filtro por Serviço */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Serviço</label>
                    <Select value={filterService} onValueChange={setFilterService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os serviços" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os serviços</SelectItem>
                        {uniqueServices.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Data */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Período</label>
                    <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as datas</SelectItem>
                        <SelectItem value="recent">Mais Recentes</SelectItem>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="week">Próximos 7 dias</SelectItem>
                        <SelectItem value="month">Próximos 30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Indicadores de Filtros Ativos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Busca: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterService !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Serviço: {filterService}
                  <button onClick={() => setFilterService('all')} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterDateRange !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Período: {
                    filterDateRange === 'recent' ? 'Mais Recentes' :
                    filterDateRange === 'today' ? 'Hoje' :
                    filterDateRange === 'week' ? 'Próximos 7 dias' :
                    filterDateRange === 'month' ? 'Próximos 30 dias' : ''
                  }
                  <button onClick={() => setFilterDateRange('all')} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date and View Mode Selection */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  {viewMode === 'daily' ? 'Agendamentos do Dia' : 'Todos os Agendamentos'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {viewMode === 'daily' 
                      ? formatDate(selectedDate)
                      : `${appointments.length} agendamento${appointments.length !== 1 ? 's' : ''} no total`
                    }
                  </p>
                  {viewMode === 'daily' && (
                    <Badge variant="outline" className="text-xs">
                      {displayAppointments.length} agendamento{displayAppointments.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'daily' ? 'default' : 'outline'}
                onClick={() => setViewMode('daily')}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Diária
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                onClick={() => setViewMode('all')}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Ver Todos
              </Button>
            </div>
          </div>
        </CardHeader>
        {viewMode === 'daily' && (
          <CardContent className="pt-0">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const yesterday = new Date(selectedDate);
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday);
                }}
                size="icon"
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[140px] font-medium justify-center"
                    size="sm"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {selectedDate.toDateString() === new Date().toDateString() 
                      ? 'HOJE' 
                      : selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) setSelectedDate(date);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Button
                variant="outline"
                onClick={() => {
                  const tomorrow = new Date(selectedDate);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow);
                }}
                size="icon"
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AppointmentStatus | 'all')}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm gap-1">
            📋
            <span className="hidden sm:inline">Todos</span>
            <span className="sm:hidden">Todos</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {displayAppointments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="text-xs sm:text-sm gap-1">
            🗓️
            <span className="hidden sm:inline">Agendados</span>
            <span className="sm:hidden">Agend.</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {getStatusCount('scheduled')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs sm:text-sm gap-1">
            ✂️
            <span className="hidden sm:inline">Em Andamento</span>
            <span className="sm:hidden">Ativo</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {getStatusCount('in_progress')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm gap-1">
            ✅
            <span className="hidden sm:inline">Concluídos</span>
            <span className="sm:hidden">Concl.</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {getStatusCount('completed')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs sm:text-sm gap-1">
            ❌
            <span className="hidden sm:inline">Cancelados</span>
            <span className="sm:hidden">Canc.</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {getStatusCount('cancelled')}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8">
                <div className="text-center space-y-2">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {hasActiveFilters 
                      ? 'Nenhum agendamento encontrado com os filtros aplicados.'
                      : `Nenhum agendamento encontrado para esta ${viewMode === 'daily' ? 'data' : 'visualização'}.`
                    }
                  </p>
                  {hasActiveFilters && (
                    <Button variant="link" onClick={clearAllFilters} size="sm">
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <p className="text-sm text-muted-foreground">
                  {filteredAppointments.length} agendamento{filteredAppointments.length !== 1 ? 's' : ''} encontrado{filteredAppointments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onComplete={handleCompleteAppointment}
                    onCancel={handleCancelAppointment}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="max-w-md mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <AlertDialogTitle className="text-center text-xl sm:text-2xl">
              Cancelar Agendamento?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3 pt-2">
              <div className="flex items-center justify-center gap-2 text-base font-medium text-foreground">
                <Scissors className="w-4 h-4" />
                <span>Confirme o cancelamento</span>
              </div>
              {getCancelAppointmentDetails() && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium text-foreground">
                      {getCancelAppointmentDetails()?.clientName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviço:</span>
                    <span className="font-medium text-foreground">
                      {getCancelAppointmentDetails()?.serviceName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data/Hora:</span>
                    <span className="font-medium text-foreground">
                      {getCancelAppointmentDetails()?.dateTime}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground pt-2">
                Esta ação não poderá ser desfeita. O agendamento será marcado como cancelado.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto mt-0">
              Manter Agendamento
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelAppointment}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Sim, Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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