// @ts-nocheck
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, CheckCircle2, ChevronLeft, ChevronRight, Trash2, Info, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduleLimitDialog } from '@/components/monthly-clients/ScheduleLimitDialog';
import { formatCurrency } from '@/lib/utils/currency';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 20; hour++) {
    if (hour < 20) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    } else {
      slots.push('20:00');
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

interface DailySchedule {
  date: string;
  time: string;
  serviceType: string;
  serviceId?: string;
  servicePrice?: number;
}

interface MonthlySchedulePickerProps {
  maxSchedules?: number;
  selectedSchedules: DailySchedule[];
  onSchedulesChange: (schedules: DailySchedule[]) => void;
  currentClientId?: string;
}

export function MonthlySchedulePicker({
  maxSchedules = 4,
  selectedSchedules,
  onSchedulesChange,
  currentClientId,
}: MonthlySchedulePickerProps) {
  const { monthlyClients, appointments, services } = useAppStore();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  // 🔥 BUSCA SERVIÇOS DO BANCO DE DADOS
  const availableServices = useMemo(() => {
    // Filtra apenas serviços ativos
    const activeServices = services.filter(service => service.active !== false);
    
    // Ordena por nome para melhor UX
    return activeServices.sort((a, b) => a.name.localeCompare(b.name));
  }, [services]);

  // 🔥 SERVIÇO PADRÃO (primeiro da lista)
  const defaultService = useMemo(() => {
    return availableServices.length > 0 ? availableServices[0] : null;
  }, [availableServices]);

  // Inicializa o serviço selecionado quando o dialog abre
  useMemo(() => {
    if (defaultService && !selectedServiceId) {
      setSelectedServiceId(defaultService.id);
    }
  }, [defaultService, selectedServiceId]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const getAppointmentsCountForDate = (date: Date): number => {
    const dateStr = format(date, 'yyyy-MM-dd');

    // Conta SOMENTE agendamentos reais criados neste dia
    const activeAppointments = appointments.filter(apt => {
      const aptDate = format(new Date(apt.scheduled_date), 'yyyy-MM-dd');
      return aptDate === dateStr && apt.status !== 'cancelled';
    });

    return activeAppointments.length;
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return selectedSchedules.filter(s => s.date === dateStr);
  };

  const isSlotOccupied = (date: Date, time: string): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');

    // Verifica SOMENTE agendamentos reais neste dia/horário
    const occupiedByAppointment = appointments.some(apt => {
      const aptDate = format(new Date(apt.scheduled_date), 'yyyy-MM-dd');
      const aptTime = format(new Date(apt.scheduled_date), 'HH:mm');
      return aptDate === dateStr && aptTime === time && apt.status !== 'cancelled';
    });

    return occupiedByAppointment;
  };

  const getOccupiedSlotsForDate = (date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const occupied: string[] = [];

    // Lista SOMENTE agendamentos reais não cancelados
    appointments.forEach(apt => {
      const aptDate = format(new Date(apt.scheduled_date), 'yyyy-MM-dd');
      
      if (aptDate === dateStr && apt.status !== 'cancelled') {
        const aptTime = format(new Date(apt.scheduled_date), 'HH:mm');
        occupied.push(aptTime);
      }
    });

    return [...new Set(occupied)].sort();
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today || date.getMonth() !== currentMonth.getMonth()) {
      return;
    }

    if (selectedSchedules.length >= maxSchedules) {
      setShowLimitDialog(true);
      return;
    }

    const occupiedSlots = getOccupiedSlotsForDate(date);
    const firstAvailable = TIME_SLOTS.find(slot => !occupiedSlots.includes(slot));
    
    if (firstAvailable) {
      setSelectedTime(firstAvailable);
    } else {
      setSelectedTime(TIME_SLOTS[0]);
    }

    // Define o serviço padrão ao abrir o dialog
    if (defaultService) {
      setSelectedServiceId(defaultService.id);
    }

    setSelectedDate(date);
    setIsTimeDialogOpen(true);
  };

  const handleAddSchedule = () => {
    if (!selectedDate || !selectedServiceId) return;

    if (selectedSchedules.length >= maxSchedules) {
      setShowLimitDialog(true);
      return;
    }

    if (isSlotOccupied(selectedDate, selectedTime)) {
      alert('Este horário já está ocupado por outro cliente!');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const alreadyExists = selectedSchedules.some(
      s => s.date === dateStr && s.time === selectedTime
    );

    if (alreadyExists) {
      alert('Você já selecionou este horário nesta data!');
      return;
    }

    // 🔥 BUSCA INFORMAÇÕES COMPLETAS DO SERVIÇO
    const selectedService = availableServices.find(s => s.id === selectedServiceId);
    
    if (!selectedService) {
      alert('Serviço não encontrado. Por favor, tente novamente.');
      return;
    }

    onSchedulesChange([
      ...selectedSchedules,
      { 
        date: dateStr, 
        time: selectedTime, 
        serviceType: selectedService.name,
        serviceId: selectedService.id,
        servicePrice: selectedService.price
      }
    ]);

    setIsTimeDialogOpen(false);
  };

  const handleRemoveSchedule = (date: string, time: string) => {
    onSchedulesChange(
      selectedSchedules.filter(s => !(s.date === date && s.time === time))
    );
  };

  const getPlanInfo = () => {
    switch (maxSchedules) {
      case 2:
        return { 
          name: 'Premium', icon: '💎', desc: 'Até 2 cortes no mês',
          gradient: 'from-purple-500 to-pink-500'
        };
      case 4:
        return { 
          name: 'VIP', icon: '👑', desc: 'Até 4 cortes no mês',
          gradient: 'from-amber-500 to-orange-500'
        };
      default:
        return { 
          name: 'Personalizado', icon: '📅', desc: `Até ${maxSchedules} cortes no mês`,
          gradient: 'from-gray-500 to-gray-600'
        };
    }
  };

  // 🔥 CALCULA VALOR TOTAL DOS AGENDAMENTOS
  const totalValue = useMemo(() => {
    return selectedSchedules.reduce((sum, schedule) => {
      return sum + (schedule.servicePrice || 0);
    }, 0);
  }, [selectedSchedules]);

  const planInfo = getPlanInfo();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {/* 🚨 ALERTA: SEM SERVIÇOS CADASTRADOS */}
      {availableServices.length === 0 && (
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                  Nenhum Serviço Disponível
                </h3>
                <p className="text-red-700 dark:text-red-300 text-sm mb-3">
                  Não há serviços cadastrados no sistema. É necessário cadastrar pelo menos um serviço antes de criar agendamentos mensais.
                </p>
                <p className="text-red-600 dark:text-red-400 text-xs font-medium">
                  💡 Vá para a seção &quot;Serviços&quot; e cadastre os serviços da sua barbearia.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={cn("border-2 bg-gradient-to-br", planInfo.gradient, "text-white")}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                {planInfo.icon}
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-1">Plano {planInfo.name}</h3>
                <p className="text-white/90 text-lg">{planInfo.desc}</p>
                <p className="text-white/70 text-sm mt-1">
                  Escolha as datas específicas no calendário abaixo
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold mb-1">
                {selectedSchedules.length}/{maxSchedules}
              </div>
              <p className="text-sm text-white/80">agendamentos</p>
              {totalValue > 0 && (
                <div className="mt-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <p className="text-xs text-white/70">Valor Total</p>
                  <p className="text-lg font-bold">{formatCurrency(totalValue)}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>Selecione as Datas</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[180px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isPast = day < today;
              const isToday = isSameDay(day, today);
              const schedules = getSchedulesForDate(day);
              const hasSchedules = schedules.length > 0;
              const appointmentsCount = getAppointmentsCountForDate(day);
              const hasExistingAppointments = appointmentsCount > 0 && isCurrentMonth && !isPast;

              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(day)}
                  disabled={!isCurrentMonth || isPast || availableServices.length === 0}
                  className={cn(
                    "relative aspect-square rounded-lg p-2 text-sm font-medium transition-all hover:shadow-md",
                    !isCurrentMonth && "text-muted-foreground/30 cursor-not-allowed",
                    isPast && isCurrentMonth && "text-muted-foreground/50 cursor-not-allowed",
                    isCurrentMonth && !isPast && availableServices.length > 0 && "hover:bg-primary/10 cursor-pointer",
                    isToday && "ring-2 ring-primary",
                    hasSchedules && "bg-green-500 text-white hover:bg-green-600",
                    !hasSchedules && isCurrentMonth && !isPast && "bg-muted/50",
                    availableServices.length === 0 && "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="text-center">{format(day, 'd')}</div>
                  
                  {hasExistingAppointments && isCurrentMonth && !isPast && (
                    <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" 
                           title={`${appointmentsCount} agendamento(s) existente(s)`} />
                    </div>
                  )}

                  {hasSchedules && (
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                      {schedules.map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-white" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted/50 border" />
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Seu agendamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted/50 border relative">
                <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-orange-500" />
              </div>
              <span>Com agendamentos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted-foreground/30" />
              <span>Indisponível</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📅 Seus Agendamentos ({selectedSchedules.length})</span>
              <div className="flex items-center gap-2">
                {totalValue > 0 && (
                  <Badge variant="outline" className="text-base px-3 py-1">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {formatCurrency(totalValue)}
                  </Badge>
                )}
                {selectedSchedules.length === maxSchedules && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completo
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedSchedules
                .sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime())
                .map((schedule, idx) => {
                  const scheduleDate = new Date(schedule.date + 'T00:00:00');
                  const dayOfWeek = DAYS_OF_WEEK[scheduleDate.getDay()];
                  
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-xl font-bold">
                        {idx + 1}
                      </div>

                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Data</div>
                          <div className="font-semibold">
                            {scheduleDate.toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-muted-foreground">{dayOfWeek}</div>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Horário</div>
                          <div className="font-semibold text-purple-600 text-xl">
                            {schedule.time}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Serviço</div>
                          <div className="font-medium text-sm">
                            {schedule.serviceType}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Valor</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            {schedule.servicePrice ? formatCurrency(schedule.servicePrice) : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSchedule(schedule.date, schedule.time)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  );
                })}
            </div>

            {/* RESUMO FINANCEIRO */}
            {totalValue > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valor Total do Plano</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalValue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Valor Médio</p>
                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalValue / selectedSchedules.length)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isTimeDialogOpen} onOpenChange={setIsTimeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Escolha o Horário e Serviço
            </DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          {selectedDate && getOccupiedSlotsForDate(selectedDate).length > 0 && (
            <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                      Horários ocupados neste dia:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {getOccupiedSlotsForDate(selectedDate).map(time => (
                        <Badge key={time} variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Horário</label>
              <Select 
                value={selectedTime} 
                onValueChange={(value) => {
                  const isOccupied = selectedDate && isSlotOccupied(selectedDate, value);
                  if (!isOccupied) {
                    setSelectedTime(value);
                  }
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {TIME_SLOTS.map((time) => {
                    const occupied = selectedDate && isSlotOccupied(selectedDate, time);
                    const alreadySelected = selectedDate && 
                      selectedSchedules.some(s => 
                        s.date === format(selectedDate, 'yyyy-MM-dd') && s.time === time
                      );

                    return (
                      <SelectItem
                        key={time}
                        value={time}
                        disabled={occupied || alreadySelected}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono font-semibold">{time}</span>
                          {occupied && (
                            <Badge variant="destructive" className="ml-3 text-xs">
                              Ocupado
                            </Badge>
                          )}
                          {alreadySelected && (
                            <Badge variant="secondary" className="ml-3 text-xs">
                              Já selecionado
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 🔥 SELETOR DE SERVIÇOS DO BANCO DE DADOS */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Serviço</label>
              {availableServices.length > 0 ? (
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center justify-between w-full gap-3">
                          <span className="font-medium">{service.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {formatCurrency(service.price)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {service.duration}min
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Nenhum serviço disponível. Cadastre serviços antes de continuar.
                  </p>
                </div>
              )}

              {/* PREVIEW DO SERVIÇO SELECIONADO */}
              {selectedServiceId && availableServices.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-3">
                    {(() => {
                      const service = availableServices.find(s => s.id === selectedServiceId);
                      if (!service) return null;
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              {service.name}
                            </span>
                            <Badge className="bg-blue-600">
                              {formatCurrency(service.price)}
                            </Badge>
                          </div>
                          {service.description && (
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-blue-600 dark:text-blue-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {service.duration} minutos
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {formatCurrency(service.price)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>

            <Button
              onClick={handleAddSchedule}
              className="w-full h-12"
              disabled={
                !selectedDate ||
                !selectedServiceId ||
                availableServices.length === 0 ||
                (selectedDate && isSlotOccupied(selectedDate, selectedTime))
              }
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Confirmar Agendamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedSchedules.length === 0 && availableServices.length > 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="pt-12 pb-12">
            <div className="text-center text-muted-foreground max-w-md mx-auto">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-3">Selecione as Datas no Calendário</h3>
              <p className="text-base mb-2">
                Clique nos dias do calendário para escolher seus horários
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-4 text-left">
                <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 Como funciona:
                </div>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>✅ Clique em qualquer dia disponível do calendário</li>
                  <li>✅ Escolha o horário e serviço desejado</li>
                  <li>✅ Dias com 🟠 pontinho laranja têm agendamentos existentes</li>
                  <li>✅ Horários ocupados ficam bloqueados automaticamente</li>
                  <li>✅ Você pode agendar até {maxSchedules} vezes no mês</li>
                  <li>✅ O valor total é calculado automaticamente</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔥 POPUP DE LIMITE */}
      <ScheduleLimitDialog
        open={showLimitDialog}
        onOpenChange={setShowLimitDialog}
        currentCount={selectedSchedules.length}
        maxSchedules={maxSchedules}
        planName={planInfo.name}
        planIcon={planInfo.icon}
        planGradient={planInfo.gradient}
      />
    </div>
  );
}