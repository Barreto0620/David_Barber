// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  CalendarDays,
  CalendarRange,
  Grid3x3,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAppointmentsByDateRange,
  fetchClients,
  fetchServices,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  type Appointment,
  type Client,
  type Service,
} from '@/lib/supabase';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, parseISO, addWeeks, subWeeks, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppointmentModal from '@/components/calendar/AppointmentModal';

type ViewMode = 'month' | 'week' | 'day';

const STATUS_COLORS = {
  scheduled: 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300',
  in_progress: 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300',
  completed: 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300',
  cancelled: 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300',
};

const STATUS_LABELS = {
  scheduled: 'Agendado',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [currentDate, viewMode]);

  const loadInitialData = async () => {
    try {
      const [clientsData, servicesData] = await Promise.all([
        fetchClients(),
        fetchServices(),
      ]);
      setClients(clientsData);
      setServices(servicesData);
    } catch (error) {
      toast.error('Erro ao carregar dados iniciais');
      console.error(error);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      let startDate, endDate;

      if (viewMode === 'month') {
        startDate = startOfWeek(startOfMonth(currentDate), { locale: ptBR });
        endDate = endOfWeek(endOfMonth(currentDate), { locale: ptBR });
      } else if (viewMode === 'week') {
        startDate = startOfWeek(currentDate, { locale: ptBR });
        endDate = endOfWeek(currentDate, { locale: ptBR });
      } else {
        startDate = startOfDay(currentDate);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59);
      }

      const data = await fetchAppointmentsByDateRange(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      setAppointments(data);
    } catch (error) {
      toast.error('Erro ao carregar agendamentos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleSaveAppointment = async (data: any) => {
    try {
      if (selectedAppointment) {
        await updateAppointment(selectedAppointment.id, data);
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        await createAppointment(data);
        toast.success('Agendamento criado com sucesso!');
      }
      loadAppointments();
      setIsModalOpen(false);
    } catch (error: any) {
      // Mensagem de erro mais específica
      const errorMessage = error?.message || 'Erro ao salvar agendamento';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteAppointment(id);
      toast.success('Agendamento excluído com sucesso!');
      loadAppointments();
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Erro ao excluir agendamento');
      console.error(error);
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.scheduled_date);
      return isSameDay(aptDate, date);
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });
    const today = startOfDay(new Date());

    const rows = [];
    let days = [];
    let day = startDate;

    // Header dos dias da semana
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(
        <div key={i} className="text-center text-sm font-semibold text-muted-foreground py-2">
          {format(addDays(startDate, i), 'EEE', { locale: ptBR })}
        </div>
      );
    }
    rows.push(
      <div key="header" className="grid grid-cols-7 border-b">
        {weekDays}
      </div>
    );

    // Dias do mês
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayAppointments = getAppointmentsForDate(day);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isDayToday = isToday(day);
        const isPastDate = cloneDay < today;

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] border-r border-b p-2 transition-colors ${
              !isCurrentMonth ? 'bg-muted/30' : ''
            } ${
              isPastDate 
                ? 'bg-muted/50 opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:bg-accent/50'
            }`}
            onClick={() => !isPastDate && handleDateClick(cloneDay)}
            title={isPastDate ? 'Data passada - não é possível agendar' : 'Clique para agendar'}
          >
            <div className={`text-sm font-medium mb-1 ${
              isDayToday
                ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center'
                : isCurrentMonth && !isPastDate
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}>
              {format(day, 'd')}
            </div>
            <div className="space-y-1">
              {dayAppointments.slice(0, 3).map((apt) => (
                <div
                  key={apt.id}
                  className={`text-xs p-1 rounded border-l-2 ${STATUS_COLORS[apt.status]} cursor-pointer hover:opacity-80`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAppointmentClick(apt);
                  }}
                >
                  <div className="font-semibold truncate">
                    {format(parseISO(apt.scheduled_date), 'HH:mm')}
                  </div>
                  <div className="truncate">{apt.service_type}</div>
                </div>
              ))}
              {dayAppointments.length > 3 && (
                <div className="text-xs text-muted-foreground pl-1">
                  +{dayAppointments.length - 3} mais
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="border rounded-lg overflow-hidden">{rows}</div>;
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const today = startOfDay(new Date());

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-8 border-b bg-muted/30">
          <div className="p-2 border-r"></div>
          {days.map((day) => {
            const isPastDate = day < today;
            return (
              <div
                key={day.toString()}
                className={`p-2 text-center border-r last:border-r-0 ${
                  isToday(day) ? 'bg-primary/10' : ''
                } ${
                  isPastDate ? 'opacity-50 bg-muted/50' : ''
                }`}
              >
                <div className="text-sm font-semibold">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isToday(day)
                      ? 'bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center mx-auto'
                      : ''
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid de horários */}
        <div className="overflow-auto max-h-[600px]">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b">
              <div className="p-2 border-r text-xs text-muted-foreground text-right">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map((day) => {
                const isPastDate = day < today;
                const isPastHour = isSameDay(day, today) && hour < new Date().getHours();
                const isDisabled = isPastDate || isPastHour;
                
                const dayAppointments = getAppointmentsForDate(day).filter((apt) => {
                  const aptHour = parseISO(apt.scheduled_date).getHours();
                  return aptHour === hour;
                });

                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`p-1 border-r last:border-r-0 min-h-[60px] transition-colors ${
                      isDisabled 
                        ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-accent/50'
                    }`}
                    onClick={() => {
                      if (!isDisabled) {
                        const dateTime = new Date(day);
                        dateTime.setHours(hour, 0, 0, 0);
                        handleDateClick(dateTime);
                      }
                    }}
                    title={isDisabled ? 'Horário passado - não é possível agendar' : 'Clique para agendar'}
                  >
                    {dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className={`text-xs p-1 rounded mb-1 border-l-2 ${STATUS_COLORS[apt.status]} cursor-pointer hover:opacity-80`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAppointmentClick(apt);
                        }}
                      >
                        <div className="font-semibold">
                          {format(parseISO(apt.scheduled_date), 'HH:mm')}
                        </div>
                        <div className="truncate">{apt.service_type}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayAppointments = getAppointmentsForDate(currentDate);
    const today = startOfDay(new Date());
    const isPastDate = currentDate < today;

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className={`p-4 border-b bg-muted/30 ${isPastDate ? 'opacity-50' : ''}`}>
          <div className="text-center">
            <div className="text-sm font-semibold text-muted-foreground">
              {format(currentDate, 'EEEE', { locale: ptBR })}
            </div>
            <div
              className={`text-3xl font-bold ${
                isToday(currentDate)
                  ? 'bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center mx-auto mt-2'
                  : 'mt-2'
              }`}
            >
              {format(currentDate, 'd')}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </div>
            {isPastDate && (
              <div className="text-sm text-amber-600 dark:text-amber-500 mt-2 font-medium">
                ⚠️ Data passada - não é possível criar novos agendamentos
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="overflow-auto max-h-[600px]">
          {hours.map((hour) => {
            const isPastHour = isToday(currentDate) && hour < new Date().getHours();
            const isDisabled = isPastDate || isPastHour;
            
            const hourAppointments = dayAppointments.filter((apt) => {
              const aptHour = parseISO(apt.scheduled_date).getHours();
              return aptHour === hour;
            });

            return (
              <div key={hour} className="flex border-b">
                <div className="w-20 p-2 border-r text-sm text-muted-foreground text-right flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div
                  className={`flex-1 p-2 min-h-[80px] transition-colors ${
                    isDisabled 
                      ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-accent/50'
                  }`}
                  onClick={() => {
                    if (!isDisabled) {
                      const dateTime = new Date(currentDate);
                      dateTime.setHours(hour, 0, 0, 0);
                      handleDateClick(dateTime);
                    }
                  }}
                  title={isDisabled ? 'Horário passado - não é possível agendar' : 'Clique para agendar'}
                >
                  {hourAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className={`p-3 rounded-lg mb-2 border-l-4 ${STATUS_COLORS[apt.status]} cursor-pointer hover:opacity-80`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(apt);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold">
                          {format(parseISO(apt.scheduled_date), 'HH:mm')}
                        </div>
                        <Badge variant="outline">{STATUS_LABELS[apt.status]}</Badge>
                      </div>
                      <div className="font-medium">{apt.service_type}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        R$ {apt.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie seus agendamentos
          </p>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Dia
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            <CalendarRange className="h-4 w-4 mr-2" />
            Semana
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            <Grid3x3 className="h-4 w-4 mr-2" />
            Mês
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <h2 className="text-2xl font-bold">
              {viewMode === 'month' &&
                format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              {viewMode === 'week' &&
                `${format(startOfWeek(currentDate, { locale: ptBR }), 'd MMM', {
                  locale: ptBR,
                })} - ${format(endOfWeek(currentDate, { locale: ptBR }), 'd MMM yyyy', {
                  locale: ptBR,
                })}`}
              {viewMode === 'day' &&
                format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h2>

            <Button onClick={() => handleDateClick(new Date())}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Views */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500"></div>
              <span className="text-sm">Agendado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500"></div>
              <span className="text-sm">Em Andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500"></div>
              <span className="text-sm">Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500"></div>
              <span className="text-sm">Cancelado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <AppointmentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        appointment={selectedAppointment}
        selectedDate={selectedDate}
        clients={clients}
        services={services}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
      />
    </div>
  );
}