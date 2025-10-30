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
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
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

interface ScheduleSelection {
  dayOfWeek: number;
  time: string;
  serviceType: string;
}

interface MonthlySchedulePickerProps {
  maxSchedules?: number;
  selectedSchedules: ScheduleSelection[];
  onSchedulesChange: (schedules: ScheduleSelection[]) => void;
  currentClientId?: string; // Para edição
}

export function MonthlySchedulePicker({
  maxSchedules = 4,
  selectedSchedules,
  onSchedulesChange,
  currentClientId
}: MonthlySchedulePickerProps) {
  const { appointments, monthlyClients } = useAppStore();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<string>(SERVICE_TYPES[0]);

  // Calcula horários ocupados
  const occupiedSlots = useMemo(() => {
    const occupied: Record<number, Set<string>> = {};
    
    // Inicializa sets para cada dia
    DAYS_OF_WEEK.forEach(day => {
      occupied[day.value] = new Set();
    });

    // 1. Marca horários de clientes mensais
    monthlyClients.forEach(mc => {
      // Ignora o cliente atual se estiver editando
      if (currentClientId && mc.client_id === currentClientId) return;
      
      if (mc.status === 'active') {
        mc.schedules.forEach(schedule => {
          occupied[schedule.day_of_week]?.add(schedule.time);
        });
      }
    });

    // 2. Marca horários de agendamentos futuros
    const today = new Date();
    const futureAppointments = appointments.filter(apt => {
      if (apt.status === 'cancelled' || apt.status === 'completed') return false;
      
      const aptDate = new Date(apt.scheduled_date);
      return aptDate >= today;
    });

    futureAppointments.forEach(apt => {
      const aptDate = new Date(apt.scheduled_date);
      const dayOfWeek = aptDate.getDay();
      const time = aptDate.toTimeString().slice(0, 5); // HH:MM
      
      occupied[dayOfWeek]?.add(time);
    });

    return occupied;
  }, [appointments, monthlyClients, currentClientId]);

  // Verifica se um slot está ocupado
  const isSlotOccupied = (day: number, time: string) => {
    return occupiedSlots[day]?.has(time) || false;
  };

  // Verifica se um slot está selecionado
  const isSlotSelected = (day: number, time: string) => {
    return selectedSchedules.some(
      s => s.dayOfWeek === day && s.time === time
    );
  };

  // Toggle de seleção de horário
  const toggleSlot = (day: number, time: string) => {
    const isSelected = isSlotSelected(day, time);
    
    if (isSelected) {
      // Remove seleção
      onSchedulesChange(
        selectedSchedules.filter(s => !(s.dayOfWeek === day && s.time === time))
      );
    } else {
      // Adiciona seleção (se não atingiu o limite)
      if (selectedSchedules.length >= maxSchedules) {
        return;
      }
      
      onSchedulesChange([
        ...selectedSchedules,
        { dayOfWeek: day, time, serviceType: selectedService }
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

  return (
    <div className="space-y-6">
      {/* Seleções Atuais */}
      {selectedSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Horários Selecionados ({selectedSchedules.length}/{maxSchedules})</span>
              {selectedSchedules.length === maxSchedules && (
                <Badge variant="outline" className="border-green-500 text-green-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completo
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedSchedules.map((schedule, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {DAYS_OF_WEEK[schedule.dayOfWeek].label}
                      </span>
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
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSchedule(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
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
            <span>Selecione os Horários Semanais</span>
            <Badge variant="outline">
              {selectedSchedules.length}/{maxSchedules} selecionados
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Abas de Dias da Semana */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {DAYS_OF_WEEK.slice(1, 6).map(day => { // Segunda a Sexta
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

          {/* Grade de Horários */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[400px] overflow-y-auto">
            {TIME_SLOTS.map(time => {
              const occupied = isSlotOccupied(selectedDay, time);
              const selected = isSlotSelected(selectedDay, time);
              const canSelect = !occupied && (selected || selectedSchedules.length < maxSchedules);

              return (
                <button
                  key={time}
                  onClick={() => {
                    if (!occupied && canSelect) {
                      toggleSlot(selectedDay, time);
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

          {selectedSchedules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Selecione até {maxSchedules} horários semanais</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}