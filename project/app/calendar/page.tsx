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
      const dayFormat = window.innerWidth < 640 ? 'EEEEE' : 'EEE';
      weekDays.push(
        <div key={i} className="text-center text-[10px] xs:text-xs sm:text-sm font-semibold text-muted-foreground py-1.5 sm:py-2 px-0.5">
          {format(addDays(startDate, i), dayFormat, { locale: ptBR })}
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
            className={`min-h-[60px] xs:min-h-[70px] sm:min-h-[90px] md:min-h-[110px] border-r border-b p-0.5 xs:p-1 sm:p-2 transition-colors ${
              !isCurrentMonth ? 'bg-muted/30' : ''
            } ${
              isPastDate
                ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:bg-accent/50 active:bg-accent'
            }`}
            onClick={() => !isPastDate && handleDateClick(cloneDay)}
            title={isPastDate ? 'Data passada - não é possível agendar' : 'Clique para agendar'}
          >
            <div className={`text-[10px] xs:text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 flex items-center justify-center ${
              isDayToday
                ? 'bg-primary text-primary-foreground rounded-full w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[9px] xs:text-[10px] sm:text-xs'
                : isCurrentMonth && !isPastDate
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}>
              {format(day, 'd')}
            </div>
            
            {/* Desktop: mostra agendamentos */}
            <div className="space-y-0.5 sm:space-y-1 hidden md:block">
              {dayAppointments.slice(0, 2).map((apt) => (
                <div
                  key={apt.id}
                  className={`text-[10px] p-0.5 sm:p-1 rounded border-l-2 ${STATUS_COLORS[apt.status]} cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAppointmentClick(apt);
                  }}
                >
                  <div className="font-semibold truncate">
                    {format(parseISO(apt.scheduled_date), 'HH:mm')}
                  </div>
                  <div className="truncate leading-tight">{apt.service_type}</div>
                </div>
              ))}
              {dayAppointments.length > 2 && (
                <div className="text-[9px] sm:text-[10px] text-muted-foreground pl-0.5 sm:pl-1">
                  +{dayAppointments.length - 2} mais
                </div>
              )}
            </div>
            
            {/* Mobile/Tablet: indicadores de quantidade */}
            {dayAppointments.length > 0 && (
              <div className="md:hidden flex items-center justify-center gap-0.5 mt-0.5">
                {dayAppointments.slice(0, 3).map((apt, idx) => (
                  <div 
                    key={apt.id}
                    className={`w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full ${
                      apt.status === 'scheduled' ? 'bg-blue-500' :
                      apt.status === 'in_progress' ? 'bg-yellow-500' :
                      apt.status === 'completed' ? 'bg-green-500' :
                      'bg-red-500'
                    }`}
                  />
                ))}
                {dayAppointments.length > 3 && (
                  <span className="text-[8px] xs:text-[9px] text-muted-foreground ml-0.5">+{dayAppointments.length - 3}</span>
                )}
              </div>
            )}
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
        <div className="grid grid-cols-[50px_repeat(7,1fr)] sm:grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/30">
          <div className="p-1 sm:p-2 border-r"></div>
          {days.map((day) => {
            const isPastDate = day < today;
            return (
              <div
                key={day.toString()}
                className={`p-1 sm:p-2 text-center border-r last:border-r-0 ${
                  isToday(day) ? 'bg-primary/10' : ''
                } ${
                  isPastDate ? 'opacity-50 bg-muted/50' : ''
                }`}
              >
                <div className="text-[9px] xs:text-[10px] sm:text-xs font-semibold truncate">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div
                  className={`text-sm xs:text-base sm:text-xl md:text-2xl font-bold ${
                    isToday(day)
                      ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center mx-auto text-xs sm:text-base'
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
        <div className="overflow-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px] custom-scrollbar">
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: hsl(var(--muted-foreground) / 0.3);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: hsl(var(--muted-foreground) / 0.5);
            }
            @media (max-width: 640px) {
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
                height: 4px;
              }
            }
          `}</style>
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[50px_repeat(7,1fr)] sm:grid-cols-[60px_repeat(7,1fr)] border-b">
              <div className="p-1 sm:p-2 border-r text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground text-right flex-shrink-0">
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
                    className={`p-0.5 xs:p-1 border-r last:border-r-0 min-h-[50px] sm:min-h-[60px] transition-colors ${
                      isDisabled 
                        ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-accent/50 active:bg-accent'
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
                        className={`text-[9px] xs:text-[10px] sm:text-xs p-0.5 sm:p-1 rounded mb-0.5 sm:mb-1 border-l-2 ${STATUS_COLORS[apt.status]} cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAppointmentClick(apt);
                        }}
                      >
                        <div className="font-semibold truncate">
                          {format(parseISO(apt.scheduled_date), 'HH:mm')}
                        </div>
                        <div className="truncate leading-tight hidden sm:block">{apt.service_type}</div>
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
        <div className={`p-3 sm:p-4 border-b bg-muted/30 ${isPastDate ? 'opacity-50' : ''}`}>
          <div className="text-center space-y-1 sm:space-y-2">
            <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {format(currentDate, 'EEEE', { locale: ptBR })}
            </div>
            <div
              className={`text-2xl sm:text-3xl font-bold ${
                isToday(currentDate)
                  ? 'bg-primary text-primary-foreground rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto'
                  : ''
              }`}
            >
              {format(currentDate, 'd')}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </div>
            {isPastDate && (
              <div className="text-xs sm:text-sm text-amber-600 dark:text-amber-500 font-medium mt-2">
                ⚠️ Data passada - não é possível criar novos agendamentos
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="overflow-auto max-h-[500px] sm:max-h-[600px] custom-scrollbar">
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: hsl(var(--muted-foreground) / 0.3);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: hsl(var(--muted-foreground) / 0.5);
            }
            @media (max-width: 640px) {
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
                height: 4px;
              }
            }
          `}</style>
          {hours.map((hour) => {
            const isPastHour = isToday(currentDate) && hour < new Date().getHours();
            const isDisabled = isPastDate || isPastHour;
            
            const hourAppointments = dayAppointments.filter((apt) => {
              const aptHour = parseISO(apt.scheduled_date).getHours();
              return aptHour === hour;
            });

            return (
              <div key={hour} className="flex border-b">
                <div className="w-14 sm:w-20 p-1.5 sm:p-2 border-r text-[10px] sm:text-sm text-muted-foreground text-right flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div
                  className={`flex-1 p-2 sm:p-3 min-h-[60px] sm:min-h-[80px] transition-colors ${
                    isDisabled 
                      ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-accent/50 active:bg-accent'
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
                      className={`p-2 sm:p-3 rounded-lg mb-2 border-l-4 ${STATUS_COLORS[apt.status]} cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(apt);
                      }}
                    >
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-2 mb-1">
                        <div className="font-semibold text-xs sm:text-sm">
                          {format(parseISO(apt.scheduled_date), 'HH:mm')}
                        </div>
                        <Badge variant="outline" className="text-[10px] sm:text-xs w-fit">
                          {STATUS_LABELS[apt.status]}
                        </Badge>
                      </div>
                      <div className="font-medium text-xs sm:text-sm truncate">{apt.service_type}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
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
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mx-auto text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[2000px] mx-auto">
      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Calendário</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              Visualize e gerencie seus agendamentos
            </p>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="flex-shrink-0 h-9 text-xs sm:text-sm"
            >
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span>Dia</span>
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="flex-shrink-0 h-9 text-xs sm:text-sm"
            >
              <CalendarRange className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span>Semana</span>
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="flex-shrink-0 h-9 text-xs sm:text-sm"
            >
              <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span>Mês</span>
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <Card>
          <CardContent className="p-2.5 sm:p-3 md:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Title - Mobile first */}
              <h2 className="text-sm sm:text-lg md:text-2xl font-bold text-center px-2">
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

              {/* Controls */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handlePrevious} 
                    className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleToday} 
                    size="sm"
                    className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Hoje
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleNext} 
                    className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                  >
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>

                <Button 
                  onClick={() => handleDateClick(new Date())} 
                  size="sm" 
                  className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden xs:inline">Novo</span>
                  <span className="xs:hidden">+</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Views */}
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-500/20 border border-blue-500 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm truncate">Agendado</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-yellow-500/20 border border-yellow-500 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm truncate">Em Andamento</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500/20 border border-green-500 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm truncate">Concluído</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-500/20 border border-red-500 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm truncate">Cancelado</span>
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
    </div>
  );
}