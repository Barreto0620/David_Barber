import { useState, useMemo } from 'react';
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
import { Calendar, Clock, CheckCircle2, X, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { format, addDays, startOfMonth, endOfMonth, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
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

interface WeeklySchedule {
  dayOfWeek: number;
  time: string;
  serviceType: string;
}

interface MonthlySchedulePickerProps {
  maxSchedules?: number;
  selectedSchedules: WeeklySchedule[];
  onSchedulesChange: (schedules: WeeklySchedule[]) => void;
  currentClientId?: string;
  startDate: string;
}

export function MonthlySchedulePicker({
  maxSchedules = 4,
  selectedSchedules,
  onSchedulesChange,
  currentClientId,
  startDate
}: MonthlySchedulePickerProps) {
  const { monthlyClients } = useAppStore();
  
  // Valida e converte a data de início para objeto Date
  const validStartDate = useMemo(() => {
    try {
      if (!startDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      }

      let parsedDate: Date;

      // Tenta diferentes formatos de entrada
      if (startDate.includes('/')) {
        // Formato BR: dd/MM/yyyy
        parsedDate = parse(startDate, 'dd/MM/yyyy', new Date());
      } else if (startDate.includes('-')) {
        if (startDate.includes('T')) {
          // ISO format: 2024-11-01T00:00:00
          parsedDate = new Date(startDate);
        } else {
          // Formato: yyyy-MM-dd
          parsedDate = parse(startDate, 'yyyy-MM-dd', new Date());
        }
      } else {
        parsedDate = new Date();
      }

      if (isNaN(parsedDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      }

      parsedDate.setHours(0, 0, 0, 0);
      return parsedDate;
    } catch (error) {
      console.error('Erro ao processar data:', error);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  }, [startDate]);

  // Formata a data para exibição
  const validStartDateFormatted = format(validStartDate, 'dd/MM/yyyy');
  
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 1,
    time: '09:00',
    serviceType: SERVICE_TYPES[0]
  });

  // Calcula TODAS as datas do mês para um dia da semana específico
  const getAllDatesForDayInMonth = (dayOfWeek: number): Date[] => {
    try {
      // Parse da data
      const start = new Date(validStartDate);

      if (isNaN(start.getTime())) {
        console.error('Data inválida:', validStartDate);
        return [];
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Se a data de início for no passado, usa hoje
      const effectiveStart = start < today ? today : start;

      const monthStart = startOfMonth(effectiveStart);
      const monthEnd = endOfMonth(effectiveStart);
      
      const dates: Date[] = [];
      let currentDate = new Date(monthStart);

      // Avança até o primeiro dia da semana desejado
      while (currentDate.getDay() !== dayOfWeek) {
        currentDate = addDays(currentDate, 1);
      }

      // Coleta todas as ocorrências deste dia no mês
      while (currentDate <= monthEnd) {
        if (currentDate >= effectiveStart) {
          dates.push(new Date(currentDate));
        }
        currentDate = addDays(currentDate, 7);
      }

      console.log(`📅 Datas calculadas para ${DAYS_OF_WEEK[dayOfWeek]?.label}:`, dates.map(d => format(d, 'dd/MM/yyyy')));
      return dates;
    } catch (error) {
      console.error('Erro ao calcular datas:', error);
      return [];
    }
  };

  // Formata múltiplas datas no formato PT-BR
  const formatMultipleDates = (dates: Date[]): string => {
    if (dates.length === 0) return 'Nenhuma data disponível';
    if (dates.length === 1) return format(dates[0], 'dd/MM/yyyy', { locale: ptBR });
    
    return dates.map(d => format(d, 'dd/MM')).join(', ');
  };

  // Verifica se horário está ocupado
  const isSlotOccupied = (dayOfWeek: number, time: string): boolean => {
    return monthlyClients.some(mc => {
      if (currentClientId && mc.client_id === currentClientId) return false;
      if (mc.status !== 'active') return false;
      
      return mc.schedules.some(schedule => 
        schedule.day_of_week === dayOfWeek && schedule.time === time
      );
    });
  };

  const isAlreadySelected = (dayOfWeek: number, time: string): boolean => {
    return selectedSchedules.some(
      s => s.dayOfWeek === dayOfWeek && s.time === time
    );
  };

  const handleAddSchedule = () => {
    if (selectedSchedules.length >= maxSchedules) {
      alert(`Você já atingiu o limite de ${maxSchedules} horários para este plano!`);
      return;
    }

    if (isSlotOccupied(newSchedule.dayOfWeek, newSchedule.time)) {
      alert('Este horário já está ocupado por outro cliente mensal!');
      return;
    }

    if (isAlreadySelected(newSchedule.dayOfWeek, newSchedule.time)) {
      alert('Você já selecionou este horário!');
      return;
    }

    onSchedulesChange([...selectedSchedules, { ...newSchedule }]);
    
    // Reset para próxima seleção
    setNewSchedule({
      ...newSchedule,
      time: '09:00'
    });
  };

  const removeSchedule = (index: number) => {
    onSchedulesChange(selectedSchedules.filter((_, i) => i !== index));
  };

  const updateScheduleService = (index: number, serviceType: string) => {
    onSchedulesChange(
      selectedSchedules.map((s, i) => i === index ? { ...s, serviceType } : s)
    );
  };

  const sortedSchedules = useMemo(() => {
    return [...selectedSchedules].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.time.localeCompare(b.time);
    });
  }, [selectedSchedules]);

  const getPlanInfo = () => {
    switch (maxSchedules) {
      case 1:
        return { name: 'Básico', color: 'bg-blue-500', icon: '🔷', desc: '1 vez por semana' };
      case 2:
        return { name: 'Premium', color: 'bg-purple-500', icon: '💎', desc: 'Até 2 vezes por semana' };
      case 4:
        return { name: 'VIP', color: 'bg-amber-500', icon: '👑', desc: 'Até 4 vezes por semana' };
      default:
        return { name: 'Personalizado', color: 'bg-gray-500', icon: '📅', desc: `Até ${maxSchedules} vezes por semana` };
    }
  };

  const planInfo = getPlanInfo();
  const canAddMore = selectedSchedules.length < maxSchedules;

  // Preview das datas do dia selecionado
  const previewDates = useMemo(() => {
    return getAllDatesForDayInMonth(newSchedule.dayOfWeek);
  }, [newSchedule.dayOfWeek, validStartDate]);

  return (
    <div className="space-y-6">
      {/* Header do Plano */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-lg",
                planInfo.color
              )}>
                {planInfo.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold">Plano {planInfo.name}</h3>
                <p className="text-muted-foreground">{planInfo.desc}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">
                {selectedSchedules.length}/{maxSchedules}
              </div>
              <p className="text-xs text-muted-foreground">horários</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horários Selecionados */}
      {sortedSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Horários Recorrentes</span>
              {sortedSchedules.length === maxSchedules && (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completo
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedSchedules.map((schedule, index) => {
                const dayInfo = DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek);
                const allDates = getAllDatesForDayInMonth(schedule.dayOfWeek);
                
                return (
                  <div 
                    key={index} 
                    className="group relative p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Dia da Semana + Datas */}
                      <div className="flex flex-col min-w-[140px]">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-bold">{dayInfo?.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="font-medium text-blue-600">
                            {allDates.length} {allDates.length === 1 ? 'data' : 'datas'} no mês:
                          </div>
                          {allDates.map((date, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                              {format(date, "dd/MM/yyyy (EEE)", { locale: ptBR })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Horário */}
                      <div className="flex flex-col items-center justify-center min-w-[80px] pt-2">
                        <Clock className="w-5 h-5 text-purple-600 mb-1" />
                        <span className="text-2xl font-bold text-purple-600">{schedule.time}</span>
                      </div>

                      {/* Serviço */}
                      <div className="flex-1 pt-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Serviço</label>
                        <Select
                          value={schedule.serviceType}
                          onValueChange={(value) => updateScheduleService(index, value)}
                        >
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
                      </div>

                      {/* Botão Remover */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSchedule(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/50 mt-2"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adicionar Novo Horário */}
      {canAddMore && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Plus className="w-5 h-5 inline mr-2" />
              Adicionar Horário Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dia da Semana */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Dia da Semana</label>
                <Select
                  value={newSchedule.dayOfWeek.toString()}
                  onValueChange={(value) => {
                    const dayValue = parseInt(value);
                    console.log('Dia selecionado:', dayValue, 'startDate:', validStartDate);
                    setNewSchedule({ 
                      ...newSchedule, 
                      dayOfWeek: dayValue 
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(day => {
                      const datesCount = getAllDatesForDayInMonth(day.value).length;
                      console.log(`${day.label}: ${datesCount} datas`);
                      return (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{day.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {datesCount}x no mês
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Data início: {validStartDateFormatted}
                </p>
              </div>

              {/* Horário */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Horário</label>
                <Select
                  value={newSchedule.time}
                  onValueChange={(value) => setNewSchedule({ 
                    ...newSchedule, 
                    time: value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {TIME_SLOTS.map(time => {
                      const occupied = isSlotOccupied(newSchedule.dayOfWeek, time);
                      const selected = isAlreadySelected(newSchedule.dayOfWeek, time);
                      
                      return (
                        <SelectItem 
                          key={time} 
                          value={time}
                          disabled={occupied || selected}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{time}</span>
                            {occupied && <Badge variant="destructive" className="ml-2 text-xs">Ocupado</Badge>}
                            {selected && <Badge variant="secondary" className="ml-2 text-xs">Selecionado</Badge>}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Serviço */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Serviço</label>
                <Select
                  value={newSchedule.serviceType}
                  onValueChange={(value) => setNewSchedule({ 
                    ...newSchedule, 
                    serviceType: value 
                  })}
                >
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
              </div>
            </div>

            {/* Preview das Datas */}
            {previewDates.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Este horário será agendado em {previewDates.length} {previewDates.length === 1 ? 'data' : 'datas'} do mês:
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {previewDates.map((date, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <CheckCircle2 className="w-3 h-3" />
                          {format(date, "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botão Adicionar */}
            <Button 
              onClick={handleAddSchedule}
              className="w-full"
              size="lg"
              disabled={
                isSlotOccupied(newSchedule.dayOfWeek, newSchedule.time) ||
                isAlreadySelected(newSchedule.dayOfWeek, newSchedule.time) ||
                previewDates.length === 0
              }
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Horário ({previewDates.length} {previewDates.length === 1 ? 'agendamento' : 'agendamentos'})
            </Button>

            {/* Avisos */}
            {isSlotOccupied(newSchedule.dayOfWeek, newSchedule.time) && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-red-900 dark:text-red-100">
                  <AlertCircle className="w-4 h-4" />
                  <span>Este horário já está ocupado por outro cliente mensal</span>
                </div>
              </div>
            )}

            {isAlreadySelected(newSchedule.dayOfWeek, newSchedule.time) && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
                  <AlertCircle className="w-4 h-4" />
                  <span>Você já selecionou este horário</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando está cheio */}
      {!canAddMore && (
        <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                Plano Completo!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Você atingiu o limite de {maxSchedules} {maxSchedules === 1 ? 'horário' : 'horários'} por semana
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem vazia */}
      {selectedSchedules.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="pt-8 pb-8">
            <div className="text-center text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum horário selecionado</h3>
              <p className="text-sm">
                Selecione até {maxSchedules} {maxSchedules === 1 ? 'horário semanal' : 'horários semanais'}
              </p>
              <p className="text-xs mt-2">
                Cada horário será repetido em TODAS as ocorrências desse dia no mês
              </p>
              <p className="text-xs mt-1 font-semibold">
                Ex: Toda sexta às 14h = Todas as 4 sextas do mês às 14h
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}