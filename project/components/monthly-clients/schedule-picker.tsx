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
import { Calendar, Clock, CheckCircle2, X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

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
  maxSchedules?: number; // 2 = Premium, 4 = VIP
  selectedSchedules: WeeklySchedule[];
  onSchedulesChange: (schedules: WeeklySchedule[]) => void;
  currentClientId?: string;
}

export function MonthlySchedulePicker({
  maxSchedules = 2,
  selectedSchedules,
  onSchedulesChange,
  currentClientId,
}: MonthlySchedulePickerProps) {
  const { monthlyClients, appointments } = useAppStore();
  
  const [newSchedule, setNewSchedule] = useState<WeeklySchedule>({
    dayOfWeek: 1,
    time: '09:00',
    serviceType: SERVICE_TYPES[0]
  });

  // Verifica se horário está ocupado por OUTRO cliente mensal OU agendamento normal
  const isSlotOccupied = (dayOfWeek: number, time: string): boolean => {
    // Verifica clientes mensais
    const occupiedByMonthly = monthlyClients.some(mc => {
      if (currentClientId && mc.client_id === currentClientId) return false;
      if (mc.status !== 'active') return false;
      
      return mc.schedules.some(schedule => 
        schedule.day_of_week === dayOfWeek && schedule.time === time
      );
    });

    if (occupiedByMonthly) return true;

    // Verifica agendamentos normais neste dia da semana
    // TODO: Implementar verificação com appointments do BD
    // Por ora, retorna apenas a verificação de clientes mensais
    
    return false;
  };

  const isAlreadySelected = (dayOfWeek: number, time: string): boolean => {
    return selectedSchedules.some(
      s => s.dayOfWeek === dayOfWeek && s.time === time
    );
  };

  const handleAddSchedule = () => {
    if (selectedSchedules.length >= maxSchedules) {
      alert(`Você já atingiu o limite de ${maxSchedules} horários semanais para este plano!`);
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
      case 2:
        return { 
          name: 'Premium', 
          color: 'bg-purple-500', 
          icon: '💎', 
          desc: 'Até 2 cortes por semana',
          gradient: 'from-purple-500 to-pink-500'
        };
      case 4:
        return { 
          name: 'VIP', 
          color: 'bg-amber-500', 
          icon: '👑', 
          desc: 'Até 4 cortes por semana',
          gradient: 'from-amber-500 to-orange-500'
        };
      default:
        return { 
          name: 'Personalizado', 
          color: 'bg-gray-500', 
          icon: '📅', 
          desc: `Até ${maxSchedules} cortes por semana`,
          gradient: 'from-gray-500 to-gray-600'
        };
    }
  };

  const planInfo = getPlanInfo();
  const canAddMore = selectedSchedules.length < maxSchedules;

  return (
    <div className="space-y-6">
      {/* Header do Plano */}
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
                  Horários fixos toda semana • Sem preocupação com agendamento
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold mb-1">
                {selectedSchedules.length}/{maxSchedules}
              </div>
              <p className="text-sm text-white/80">horários fixos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horários Selecionados */}
      {sortedSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl">
              <span>📅 Seus Horários Fixos Semanais</span>
              {sortedSchedules.length === maxSchedules && (
                <Badge className="bg-green-500 text-base px-3 py-1">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Plano Completo
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedSchedules.map((schedule, index) => {
                const dayInfo = DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek);
                
                return (
                  <div 
                    key={index} 
                    className="group relative p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-6">
                      {/* Número do Horário */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-xl font-bold shadow-md">
                        {index + 1}
                      </div>

                      {/* Dia da Semana */}
                      <div className="flex flex-col min-w-[160px]">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <span className="font-bold text-lg">{dayInfo?.label}</span>
                        </div>
                        <div className="text-sm text-blue-600 font-medium">
                          Toda semana • Fixo
                        </div>
                      </div>

                      {/* Horário */}
                      <div className="flex flex-col items-center justify-center min-w-[100px] bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
                        <Clock className="w-5 h-5 text-purple-600 mb-1" />
                        <span className="text-3xl font-bold text-purple-600">{schedule.time}</span>
                      </div>

                      {/* Serviço */}
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-2 block font-medium">Serviço</label>
                        <Select
                          value={schedule.serviceType}
                          onValueChange={(value) => updateScheduleService(index, value)}
                        >
                          <SelectTrigger className="h-11 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_TYPES.map(service => (
                              <SelectItem key={service} value={service} className="text-base">
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
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/50 h-11 w-11 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
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
        <Card className="border-2 border-dashed border-primary/30">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Plus className="w-6 h-6" />
              Adicionar Horário Semanal Fixo
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Este horário será reservado para você TODA semana automaticamente
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dia da Semana */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Dia da Semana
                </label>
                <Select
                  value={newSchedule.dayOfWeek.toString()}
                  onValueChange={(value) => 
                    setNewSchedule({ ...newSchedule, dayOfWeek: parseInt(value) })
                  }
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(day => (
                      <SelectItem key={day.value} value={day.value.toString()} className="text-base py-3">
                        <span className="font-medium">{day.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Horário */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Horário
                </label>
                <Select
                  value={newSchedule.time}
                  onValueChange={(value) => 
                    setNewSchedule({ ...newSchedule, time: value })
                  }
                >
                  <SelectTrigger className="h-12 text-base">
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
                          className="text-base py-3"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-mono font-semibold">{time}</span>
                            {occupied && (
                              <Badge variant="destructive" className="ml-3 text-xs">
                                Ocupado
                              </Badge>
                            )}
                            {selected && (
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

              {/* Serviço */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Serviço Padrão</label>
                <Select
                  value={newSchedule.serviceType}
                  onValueChange={(value) => 
                    setNewSchedule({ ...newSchedule, serviceType: value })
                  }
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map(service => (
                      <SelectItem key={service} value={service} className="text-base py-3">
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview do Horário */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-2xl">
                  🎯
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-1">
                    Preview do seu horário fixo:
                  </div>
                  <div className="text-base text-blue-700 dark:text-blue-300">
                    <span className="font-semibold">
                      {DAYS_OF_WEEK.find(d => d.value === newSchedule.dayOfWeek)?.label}
                    </span>
                    {' às '}
                    <span className="font-semibold">{newSchedule.time}</span>
                    {' • '}
                    <span className="font-medium">{newSchedule.serviceType}</span>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    ✅ Reservado automaticamente toda semana
                  </div>
                </div>
              </div>
            </div>

            {/* Botão Adicionar */}
            <Button 
              onClick={handleAddSchedule}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
              disabled={
                isSlotOccupied(newSchedule.dayOfWeek, newSchedule.time) ||
                isAlreadySelected(newSchedule.dayOfWeek, newSchedule.time)
              }
            >
              <Plus className="w-6 h-6 mr-2" />
              Adicionar Horário Fixo Semanal
            </Button>

            {/* Avisos */}
            {isSlotOccupied(newSchedule.dayOfWeek, newSchedule.time) && (
              <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-3 text-red-900 dark:text-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Horário Indisponível</div>
                    <div className="text-sm">Este horário já está ocupado por outro cliente mensal</div>
                  </div>
                </div>
              </div>
            )}

            {isAlreadySelected(newSchedule.dayOfWeek, newSchedule.time) && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-center gap-3 text-amber-900 dark:text-amber-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Horário Duplicado</div>
                    <div className="text-sm">Você já selecionou este horário</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando está cheio */}
      {!canAddMore && (
        <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                Plano {planInfo.name} Completo!
              </h3>
              <p className="text-green-700 dark:text-green-300 text-lg">
                Você configurou todos os {maxSchedules} horários fixos semanais
              </p>
              <p className="text-green-600 dark:text-green-400 text-sm mt-2">
                Seus horários estão garantidos toda semana 🎉
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem vazia */}
      {selectedSchedules.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CardContent className="pt-12 pb-12">
            <div className="text-center text-muted-foreground max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                Configure Seus Horários Fixos
              </h3>
              <p className="text-base mb-2">
                Selecione até {maxSchedules} {maxSchedules === 1 ? 'horário' : 'horários'} semanais fixos
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-4 text-left">
                <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 Como funciona:
                </div>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>✅ Escolha dias e horários fixos da semana</li>
                  <li>✅ Eles se repetem automaticamente toda semana</li>
                  <li>✅ Você não precisa agendar manualmente</li>
                  <li>✅ Exemplo: Toda sexta às 14h</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}