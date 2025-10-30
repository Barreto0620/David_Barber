import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

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

// Gera horários de 9h às 19h (a cada 30 min)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 19; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Tipo para seleção com data específica
interface ScheduleSelection {
  dayOfWeek: number;
  time: string;
  serviceType: string;
  specificDate: string; // Data específica DD/MM/AAAA
}

interface MonthlySchedulePickerProps {
  maxSchedules?: number;
  selectedSchedules: ScheduleSelection[];
  onSchedulesChange: (schedules: ScheduleSelection[]) => void;
  currentClientId?: string;
  startDate: string; // Data de início do plano
}

export function MonthlySchedulePicker({
  maxSchedules = 4,
  selectedSchedules,
  onSchedulesChange,
  currentClientId,
  startDate
}: MonthlySchedulePickerProps) {
  const { appointments, monthlyClients } = useAppStore();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<string>(SERVICE_TYPES[0]);
  const [availableWeeks, setAvailableWeeks] = useState<Date[]>([]);

  // Calcula as próximas 4 semanas a partir da data de início
  useEffect(() => {
    const start = new Date(startDate);
    const weeks: Date[] = [];
    
    for (let i = 0; i < 4; i++) {
      const weekDate = new Date(start);
      weekDate.setDate(start.getDate() + (i * 7));
      weeks.push(weekDate);
    }
    
    setAvailableWeeks(weeks);
  }, [startDate]);

  // Gera todas as datas possíveis para o dia da semana selecionado
  const getAvailableDatesForDay = (dayOfWeek: number): Date[] => {
    return availableWeeks.map(weekStart => {
      const date = new Date(weekStart);
      const currentDay = date.getDay();
      const diff = dayOfWeek - currentDay;
      date.setDate(date.getDate() + diff);
      return date;
    }).filter(date => date >= new Date(startDate));
  };

  // Verifica se um horário específico está ocupado no BD
  const isSlotOccupied = (date: Date, time: string): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    const dateTimeStr = `${dateStr}T${time}:00`;
    
    // Verifica appointments existentes
    const hasAppointment = appointments.some(apt => {
      if (apt.status === 'cancelled') return false;
      
      const aptDate = new Date(apt.scheduled_date);
      const aptTime = aptDate.toTimeString().slice(0, 5);
      const aptDateStr = aptDate.toISOString().split('T')[0];
      
      return aptDateStr === dateStr && aptTime === time;
    });

    if (hasAppointment) return true;

    // Verifica outros clientes mensais (exceto o atual)
    const hasMonthlyClient = monthlyClients.some(mc => {
      if (currentClientId && mc.client_id === currentClientId) return false;
      if (mc.status !== 'active') return false;
      
      return mc.schedules.some(schedule => {
        if (schedule.day_of_week !== date.getDay()) return false;
        if (schedule.time !== time) return false;
        
        const mcStartDate = new Date(mc.start_date);
        return date >= mcStartDate;
      });
    });

    return hasMonthlyClient;
  };

  // Verifica se uma data/hora específica já foi selecionada
  const isSlotSelected = (date: Date, time: string): boolean => {
    const dateStr = date.toLocaleDateString('pt-BR');
    return selectedSchedules.some(
      s => s.specificDate === dateStr && s.time === time
    );
  };

  // Toggle de seleção de horário com data específica
  const toggleSlot = (date: Date, time: string) => {
    const dateStr = date.toLocaleDateString('pt-BR');
    const isSelected = isSlotSelected(date, time);
    
    if (isSelected) {
      // Remove seleção
      onSchedulesChange(
        selectedSchedules.filter(s => 
          !(s.specificDate === dateStr && s.time === time)
        )
      );
    } else {
      // Adiciona seleção (se não atingiu o limite)
      if (selectedSchedules.length >= maxSchedules) {
        return;
      }
      
      onSchedulesChange([
        ...selectedSchedules,
        { 
          dayOfWeek: date.getDay(), 
          time, 
          serviceType: selectedService,
          specificDate: dateStr
        }
      ]);
    }
  };

  // Remove horário específico
  const removeSchedule = (index: number) => {
    onSchedulesChange(selectedSchedules.filter((_, i) => i !== index));
  };

  // Atualiza serviço de um horário específico
  const updateScheduleService = (index: number, serviceType: string) => {
    onSchedulesChange(
      selectedSchedules.map((s, i) => i === index ? { ...s, serviceType } : s)
    );
  };

  // Ordena horários selecionados por data
  const sortedSchedules = useMemo(() => {
    return [...selectedSchedules].sort((a, b) => {
      const [dayA, monthA, yearA] = a.specificDate.split('/').map(Number);
      const [dayB, monthB, yearB] = b.specificDate.split('/').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      return a.time.localeCompare(b.time);
    });
  }, [selectedSchedules]);

  // Datas disponíveis para o dia selecionado
  const availableDates = useMemo(() => {
    return getAvailableDatesForDay(selectedDay);
  }, [selectedDay, availableWeeks]);

  return (
    <div className="space-y-6">
      {/* Seleções Atuais */}
      {sortedSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Horários Selecionados ({sortedSchedules.length}/{maxSchedules})</span>
              {sortedSchedules.length === maxSchedules && (
                <Badge variant="outline" className="border-green-500 text-green-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completo
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedSchedules.map((schedule, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 grid grid-cols-4 gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {schedule.specificDate}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{schedule.time}</span>
                    </div>

                    <Select
                      value={schedule.serviceType}
                      onValueChange={(value) => updateScheduleService(index, value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map(service => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSchedule(index)}
                      className="text-destructive hover:text-destructive ml-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seletor de Serviço Padrão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tipo de Serviço Padrão</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map(service => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Este serviço será aplicado aos novos horários selecionados
          </p>
        </CardContent>
      </Card>

      {/* Grade de Horários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Selecione os Horários (Próximas 4 Semanas)</span>
            <Badge variant="outline">
              {selectedSchedules.length}/{maxSchedules} selecionados
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Abas de Dias da Semana */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {DAYS_OF_WEEK.map(day => {
              const daySchedules = selectedSchedules.filter(s => s.dayOfWeek === day.value);
              return (
                <Button
                  key={day.value}
                  variant={selectedDay === day.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDay(day.value)}
                  className="flex-shrink-0 relative"
                >
                  {day.short}
                  {daySchedules.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-green-500">
                      {daySchedules.length}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-400" />
              <span>Ocupado</span>
            </div>
          </div>

          {/* Grade de Horários - Agora com datas específicas */}
          <div className="space-y-6 max-h-[500px] overflow-y-auto">
            {availableDates.map((date, weekIndex) => (
              <div key={weekIndex} className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2 sticky top-0 bg-background py-2">
                  <Calendar className="w-4 h-4" />
                  Semana {weekIndex + 1} - {date.toLocaleDateString('pt-BR')}
                </h4>
                
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {TIME_SLOTS.map(time => {
                    const occupied = isSlotOccupied(date, time);
                    const selected = isSlotSelected(date, time);
                    const canSelect = !occupied && (selected || selectedSchedules.length < maxSchedules);

                    return (
                      <button
                        key={`${weekIndex}-${time}`}
                        onClick={() => {
                          if (!occupied && canSelect) {
                            toggleSlot(date, time);
                          }
                        }}
                        disabled={occupied || (!selected && selectedSchedules.length >= maxSchedules)}
                        className={cn(
                          "p-3 rounded-lg text-sm font-medium transition-all",
                          "hover:scale-105 active:scale-95",
                          "disabled:cursor-not-allowed disabled:hover:scale-100",
                          selected && "bg-blue-500 text-white shadow-md",
                          !selected && !occupied && canSelect && "bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400",
                          occupied && "bg-gray-400/20 text-gray-500 dark:text-gray-600"
                        )}
                        title={
                          occupied
                            ? "Horário ocupado"
                            : selected
                            ? "Clique para remover"
                            : "Clique para selecionar"
                        }
                      >
                        <div className="flex flex-col items-center">
                          <Clock className="w-3 h-3 mb-1" />
                          {time}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selectedSchedules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Selecione até {maxSchedules} horários nas próximas 4 semanas</p>
              <p className="text-xs mt-1">Você pode escolher múltiplos horários no mesmo dia da semana</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}