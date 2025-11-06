// @ts-nocheck
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
    addNotification,
  } = useAppStore();

  // Garantir que selectedDate seja sempre um objeto Date
  const selectedDate = selectedDateFromStore instanceof Date 
    ? selectedDateFromStore 
    : new Date(selectedDateFromStore);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [newAppointmentModalOpen, setNewAppointmentModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // 🔥 MUDADO DE 'daily' PARA 'all'
  
  // Estados para busca e filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // 🔥 CORREÇÃO PRINCIPAL: Lógica de exibição de agendamentos
  const displayAppointments = useMemo(() => {
    // Se viewMode for 'all', retorna TODOS os agendamentos do banco
    if (viewMode === 'all') {
      console.log('📊 Modo "Todos": Mostrando todos os', appointments.length, 'agendamentos');
      return appointments;
    }
    
    // Se viewMode for 'daily', filtra apenas pelo dia selecionado
    const dailyAppointments = getAppointmentsByDate(appointments, selectedDate);
    console.log('📅 Modo "Diária":', dailyAppointments.length, 'agendamentos para', selectedDate.toLocaleDateString());
    return dailyAppointments;
  }, [appointments, viewMode, selectedDate]);

  // Log para debug
  useEffect(() => {
    console.log('🔍 DEBUG:');
    console.log('  - Total no banco:', appointments.length);
    console.log('  - Modo de visualização:', viewMode);
    console.log('  - Exibindo:', displayAppointments.length);
    console.log('  - Tab ativa:', activeTab);
  }, [appointments, viewMode, displayAppointments, activeTab]);

  // ===== SISTEMA DE LEMBRETES AUTOMÁTICOS =====
  useEffect(() => {
    const checkUpcomingAppointments = () => {
      const now = new Date();
      
      appointments.forEach(apt => {
        if (apt.status !== 'scheduled') return;
        
        const scheduledDate = new Date(apt.scheduled_date);
        const diffMinutes = Math.round((scheduledDate.getTime() - now.getTime()) / (1000 * 60));
        
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
        }
        
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

    checkUpcomingAppointments();
    const interval = setInterval(checkUpcomingAppointments, 60000);
    return () => clearInterval(interval);
  }, [appointments, addNotification, getClientById]);

  // Obter lista única de serviços para o filtro
  const uniqueServices = useMemo(() => {
    const services = new Set(appointments.map(apt => apt.service_type));
    return Array.from(services).sort();
  }, [appointments]);

  // 🔥 CORREÇÃO: Função de filtro de data agora considera TODOS os agendamentos
  const filterByDateRange = (apt) => {
    if (filterDateRange === 'all') return true;
    
    const aptDate = new Date(apt.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filterDateRange) {
      case 'recent': {
        // Agendamentos futuros (a partir de agora)
        const now = new Date();
        return aptDate >= now;
      }
      
      case 'today': {
        const todayStr = today.toISOString().split('T')[0];
        const aptStr = aptDate.toISOString().split('T')[0];
        return todayStr === aptStr;
      }
      
      case 'week': {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        return aptDate >= today && aptDate <= weekFromNow;
      }
      
      case 'month': {
        const monthFromNow = new Date(today);
        monthFromNow.setMonth(today.getMonth() + 1);
        return aptDate >= today && aptDate <= monthFromNow;
      }
      
      case 'past': { // 🔥 NOVO: Filtro para agendamentos passados
        return aptDate < today;
      }
      
      default:
        return true;
    }
  };

  // 🔥 CORREÇÃO: Aplicar filtros sobre displayAppointments (já filtrado por viewMode)
  const filteredAppointments = useMemo(() => {
    let filtered = activeTab === 'all' 
      ? displayAppointments 
      : getAppointmentsByStatus(displayAppointments, activeTab);
    
    console.log('🔧 Filtros aplicados:');
    console.log('  - Antes dos filtros:', filtered.length);
    
    // Filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt => {
        const client = apt.client || (apt.client_id ? getClientById(apt.client_id) : null);
        const clientName = client?.name?.toLowerCase() || '';
        const serviceName = apt.service_type?.toLowerCase() || '';
        return clientName.includes(query) || serviceName.includes(query);
      });
      console.log('  - Após busca:', filtered.length);
    }
    
    // Filtro por serviço
    if (filterService !== 'all') {
      filtered = filtered.filter(apt => apt.service_type === filterService);
      console.log('  - Após filtro de serviço:', filtered.length);
    }
    
    // Filtro por range de data
    filtered = filtered.filter(filterByDateRange);
    console.log('  - Após filtro de data:', filtered.length);
    
    // Ordenação
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime();
        
        case 'date-asc':
          return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
        
        case 'nearest': {
          const now = new Date().getTime();
          const diffA = Math.abs(new Date(a.scheduled_date).getTime() - now);
          const diffB = Math.abs(new Date(b.scheduled_date).getTime() - now);
          return diffA - diffB;
        }
        
        case 'farthest': {
          const now = new Date().getTime();
          const diffA = Math.abs(new Date(a.scheduled_date).getTime() - now);
          const diffB = Math.abs(new Date(b.scheduled_date).getTime() - now);
          return diffB - diffA;
        }
        
        case 'client-asc': {
          const clientA = a.client || getClientById(a.client_id);
          const clientB = b.client || getClientById(b.client_id);
          const nameA = clientA?.name?.toLowerCase() || '';
          const nameB = clientB?.name?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        }
        
        case 'client-desc': {
          const clientA = a.client || getClientById(a.client_id);
          const clientB = b.client || getClientById(b.client_id);
          const nameA = clientA?.name?.toLowerCase() || '';
          const nameB = clientB?.name?.toLowerCase() || '';
          return nameB.localeCompare(nameA);
        }
        
        case 'service-asc':
          return (a.service_type || '').localeCompare(b.service_type || '');
        
        case 'service-desc':
          return (b.service_type || '').localeCompare(a.service_type || '');
        
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        
        default:
          return 0;
      }
    });
    
    console.log('  - Final após ordenação:', sorted.length);
    return sorted;
  }, [displayAppointments, activeTab, searchQuery, filterService, filterDateRange, sortBy, getClientById]);

  const getStatusCount = (status) => {
    return getAppointmentsByStatus(displayAppointments, status).length;
  };
  
  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterService('all');
    setFilterDateRange('all');
    setSortBy('date-desc');
  };
  
  const hasActiveFilters = searchQuery || filterService !== 'all' || filterDateRange !== 'all' || sortBy !== 'date-desc';

  const handleCompleteAppointment = (id) => {
    const appointment = appointments.find(apt => apt.id === id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setCompletionModalOpen(true);
    }
  };

  const handleServiceCompletion = async (paymentMethod, finalPrice, notes) => {
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

  const handleCancelAppointment = (id) => {
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
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="recent">Próximos agendamentos</SelectItem>
                        <SelectItem value="week">Próximos 7 dias</SelectItem>
                        <SelectItem value="month">Próximos 30 dias</SelectItem>
                        <SelectItem value="past">Agendamentos passados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ordenação */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ordenar por</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a ordenação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">📅 Data: Mais recente</SelectItem>
                        <SelectItem value="date-asc">📅 Data: Mais antiga</SelectItem>
                        <SelectItem value="nearest">🎯 Agendamento: Mais próximo</SelectItem>
                        <SelectItem value="farthest">📆 Agendamento: Mais distante</SelectItem>
                        <SelectItem value="client-asc">👤 Cliente: A → Z</SelectItem>
                        <SelectItem value="client-desc">👤 Cliente: Z → A</SelectItem>
                        <SelectItem value="service-asc">✂️ Serviço: A → Z</SelectItem>
                        <SelectItem value="service-desc">✂️ Serviço: Z → A</SelectItem>
                        <SelectItem value="price-asc">💰 Preço: Menor → Maior</SelectItem>
                        <SelectItem value="price-desc">💰 Preço: Maior → Menor</SelectItem>
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
                <Badge variant="secondary" className="gap-1 pr-1">
                  Busca: &quot;{searchQuery}&quot;
                  <span 
                    onClick={() => setSearchQuery('')} 
                    className="ml-1 hover:text-destructive cursor-pointer inline-flex items-center justify-center w-4 h-4"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              )}
              {filterService !== 'all' && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Serviço: {filterService}
                  <span 
                    onClick={() => setFilterService('all')} 
                    className="ml-1 hover:text-destructive cursor-pointer inline-flex items-center justify-center w-4 h-4"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              )}
              {filterDateRange !== 'all' && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Período: {
                    filterDateRange === 'recent' ? 'Próximos' :
                    filterDateRange === 'today' ? 'Hoje' :
                    filterDateRange === 'week' ? 'Próximos 7 dias' :
                    filterDateRange === 'month' ? 'Próximos 30 dias' :
                    filterDateRange === 'past' ? 'Passados' : ''
                  }
                  <span 
                    onClick={() => setFilterDateRange('all')} 
                    className="ml-1 hover:text-destructive cursor-pointer inline-flex items-center justify-center w-4 h-4"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              )}
              {sortBy !== 'date-desc' && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Ordem personalizada
                  <span 
                    onClick={() => setSortBy('date-desc')} 
                    className="ml-1 hover:text-destructive cursor-pointer inline-flex items-center justify-center w-4 h-4"
                  >
                    <X className="h-3 w-3" />
                  </span>
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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
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