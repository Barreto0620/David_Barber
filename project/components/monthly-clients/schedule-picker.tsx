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
import { Calendar, Clock, CheckCircle2, ChevronLeft, ChevronRight, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const SERVICE_TYPES = [
  'Corte Simples',
  'Corte + Barba',
  'Corte Premium',
  'Corte Premium + Barba',
  'Barba',
  'Sobrancelha',
  'Luzes',
  'Hidratação',
];

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
  const { monthlyClients, appointments } = useAppStore();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedService, setSelectedService] = useState(SERVICE_TYPES[0]);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const getAppointmentsCountForDate = (date: Date): number => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);

    let count = 0;

    const allAppointmentsOnDate = appointments.filter(apt => {
      const aptDate = format(new Date(apt.scheduled_date), 'yyyy-MM-dd');
      return aptDate === dateStr;
    });

    monthlyClients.forEach(mc => {
      if (currentClientId && mc.client_id === currentClientId) return;
      if (mc.status !== 'active') return;
      
      mc.schedules.forEach(schedule => {
        if (schedule.day_of_week === dayOfWeek && schedule.active) {
          const scheduleTime = schedule.time.substring(0, 5);
          
          const hasCancelledAtThisTime = allAppointmentsOnDate.some(apt => {
            const aptTime = format(new Date(apt.scheduled_date), 'HH:mm');
            return apt.status === 'cancelled' && 
                   apt.client_id === mc.client_id && 
                   aptTime === scheduleTime;
          });
          
          const hasActiveAtThisTime = allAppointmentsOnDate.some(apt => {
            const aptTime = format(new Date(apt.scheduled_date), 'HH:mm');
            return apt.status !== 'cancelled' && 
                   apt.client_id === mc.client_id && 
                   aptTime === scheduleTime;
          });
          
          if (!hasCancelledAtThisTime || hasActiveAtThisTime) {
            count++;
          }
        }
      });
    });

    const activeAppointments = appointments.filter(apt => {
      const aptDate = format(new Date(apt.scheduled_date), 'yyyy-MM-dd');
      return aptDate === dateStr && apt.status !== 'cancelled';
    });

    count += activeAppointments.length;

    return count;
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return selectedSchedules.filter(s => s.date === dateStr);
  };

  const isSlotOccupied = (date: Date, time: string): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);

    const hasCancelledAtThisSlot = appointments.some(apt => {
      const aptDate = format(new Date(apt.scheduled_date), 'yyyy-MM-dd');
      const aptTime = format(new Date(apt.scheduled_date), 'HH:mm');
      return apt.status === 'cancelled' && aptDate === dateStr && aptTime === time;
    });

    if (hasCancelledAtThisSlot) {
      return false;
    }

    const occupiedByMonthly = monthlyClients.some(mc => {
      if (currentClientId && mc.client_id === currentClientId) return false;
      if (mc.status !== 'active') return false;
      return mc.schedules.some(schedule => {
        const normalizedScheduleTime = schedule.time.substring(0, 5);
        return schedule.day_of_week === dayOfWeek && normalizedScheduleTime === time && schedule.active;
      });
    });

    if (occupiedByMonthly) return true;

    const occupiedByAppointment = appointments.some(apt => {
      const aptDate = format(new Date(apt.scheduled_date), 'yyyy-MM-dd');
      const aptTime = format(new Date(apt.scheduled_date), 'HH:mm');
      return aptDate === dateStr && aptTime === time && apt.status !== 'cancelled';
    });

    return occupiedByAppointment;
  };

  const getOccupiedSlotsForDate = (date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);
    const occupied: string[] = [];

    const cancelledSlots = appointments
      .filter(apt => {
        const aptDate = format(new Date(apt.scheduled_date), 'yyyy-MM-dd');
        return apt.status === 'cancelled' && aptDate === dateStr;
      })
      .map(apt => format(new Date(apt.scheduled_date), 'HH:mm'));

    monthlyClients.forEach(mc => {
      if (currentClientId && mc.client_id === currentClientId) return;
      if (mc.status !== 'active') return;
      mc.schedules.forEach(schedule => {
        if (schedule.day_of_week === dayOfWeek && schedule.active) {
          const normalizedTime = schedule.time.substring(0, 5);
          
          if (!cancelledSlots.includes(normalizedTime)) {
            occupied.push(normalizedTime);
          }
        }
      });
    });

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

    setSelectedDate(date);
    setIsTimeDialogOpen(true);
  };

  const handleAddSchedule = () => {
    if (!selectedDate) return;

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

    onSchedulesChange([
      ...selectedSchedules,
      { 
        date: dateStr, 
        time: selectedTime, 
        serviceType: selectedService 
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

  const planInfo = getPlanInfo();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
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
                  disabled={!isCurrentMonth || isPast}
                  className={cn(
                    "relative aspect-square rounded-lg p-2 text-sm font-medium transition-all hover:shadow-md",
                    !isCurrentMonth && "text-muted-foreground/30 cursor-not-allowed",
                    isPast && isCurrentMonth && "text-muted-foreground/50 cursor-not-allowed",
                    isCurrentMonth && !isPast && "hover:bg-primary/10 cursor-pointer",
                    isToday && "ring-2 ring-primary",
                    hasSchedules && "bg-green-500 text-white hover:bg-green-600",
                    !hasSchedules && isCurrentMonth && !isPast && "bg-muted/50"
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
              {selectedSchedules.length === maxSchedules && (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completo
                </Badge>
              )}
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

                      <div className="flex-1 grid grid-cols-3 gap-4">
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
          </CardContent>
        </Card>
      )}

      <Dialog open={isTimeDialogOpen} onOpenChange={setIsTimeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Escolha o Horário
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

            <div className="space-y-2">
              <label className="text-sm font-semibold">Serviço</label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAddSchedule}
              className="w-full h-12"
              disabled={
                !selectedDate ||
                (selectedDate && isSlotOccupied(selectedDate, selectedTime))
              }
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Confirmar Agendamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedSchedules.length === 0 && (
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
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <DialogTitle className="text-center text-2xl">
              Limite Atingido!
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Você já atingiu o limite de <strong>{maxSchedules} agendamentos</strong> para o plano {planInfo.name}.
            </DialogDescription>
          </DialogHeader>
          
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-orange-600">
                  {selectedSchedules.length} / {maxSchedules}
                </div>
                <p className="text-sm text-muted-foreground">
                  Agendamentos selecionados
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2 pt-2">
            <p className="text-sm text-muted-foreground text-center">
              Para adicionar mais agendamentos, você pode:
            </p>
            <ul className="text-sm space-y-1 pl-6">
              <li>✅ Remover um agendamento existente</li>
              <li>✅ Ou escolher um plano com mais visitas</li>
            </ul>
          </div>

          <Button 
            onClick={() => setShowLimitDialog(false)}
            className="w-full h-12"
          >
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}