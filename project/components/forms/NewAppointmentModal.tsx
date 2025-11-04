// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, AlertCircle, Calendar, Clock, ChevronLeft, ChevronRight, Info, Plus, User, Scissors, DollarSign, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { Client, Service } from '@/types/database';
import { toast } from 'sonner';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface NewAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidationErrors {
  client?: string;
  service?: string;
  date?: string;
  time?: string;
}

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

// Funções de data sem date-fns
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (date: Date) => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  
  return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
};

const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

export function NewAppointmentModal({ open, onClose, onSuccess }: NewAppointmentModalProps) {
  const { clients, services, appointments, addAppointment, addClient } = useAppStore();
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Quick Add Client
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientEmail, setQuickClientEmail] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Dias do mês anterior
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(new Date(prevYear, prevMonth, daysInPrevMonth - i));
    }
    
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Dias do próximo mês
    const remainingDays = 42 - days.length; // 6 semanas * 7 dias
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(nextYear, nextMonth, i));
    }
    
    return days;
  }, [currentMonth]);

  const isTimeSlotAvailable = (date: Date, timeSlot: string) => {
    if (!selectedService) return true;

    const [hours, minutes] = timeSlot.split(':').map(Number);
    const proposedDateTime = new Date(date);
    proposedDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const today = formatDate(now);
    const selectedDateStr = formatDate(date);
    
    if (selectedDateStr === today) {
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
      const proposedTimeInMinutes = hours * 60 + minutes;
      
      if (proposedTimeInMinutes <= currentTimeInMinutes + 30) {
        return false;
      }
    }

    const dateStr = formatDate(date);
    const dayStart = new Date(dateStr + 'T00:00:00');
    const dayEnd = new Date(dateStr + 'T23:59:59');

    const occupiedSlots = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.scheduled_date);
      return appointmentDate >= dayStart && appointmentDate <= dayEnd && appointment.status !== 'cancelled';
    });

    const proposedEnd = new Date(proposedDateTime.getTime() + selectedService.duration_minutes * 60000);

    return !occupiedSlots.some(occupied => {
      const occupiedStart = new Date(occupied.scheduled_date);
      const service = services.find(s => s.name === occupied.service_type);
      const durationMinutes = service?.duration_minutes || 60;
      const occupiedEnd = new Date(occupiedStart.getTime() + durationMinutes * 60000);

      return (proposedDateTime < occupiedEnd && proposedEnd > occupiedStart);
    });
  };

  const getOccupiedSlotsForDate = (date: Date): string[] => {
    const dateStr = formatDate(date);
    const occupied: string[] = [];

    appointments.forEach(apt => {
      const aptDate = new Date(apt.scheduled_date);
      const aptDateStr = formatDate(aptDate);
      
      if (aptDateStr === dateStr && apt.status !== 'cancelled') {
        const hours = aptDate.getHours().toString().padStart(2, '0');
        const minutes = aptDate.getMinutes().toString().padStart(2, '0');
        occupied.push(`${hours}:${minutes}`);
      }
    });

    return [...new Set(occupied)].sort();
  };

  const getAppointmentsCountForDate = (date: Date): number => {
    const dateStr = formatDate(date);
    const activeAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_date);
      const aptDateStr = formatDate(aptDate);
      return aptDateStr === dateStr && apt.status !== 'cancelled';
    });
    return activeAppointments.length;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!selectedClient) newErrors.client = 'Selecione um cliente';
    if (!selectedService) newErrors.service = 'Selecione um serviço';
    if (!selectedDate) newErrors.date = 'Selecione uma data';
    if (!selectedTime) newErrors.time = 'Selecione um horário';

    if (selectedService && selectedDate && selectedTime) {
      if (!isTimeSlotAvailable(selectedDate, selectedTime)) {
        newErrors.time = `Horário ${selectedTime} não disponível`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field: keyof ValidationErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today || date.getMonth() !== currentMonth.getMonth()) {
      return;
    }

    setSelectedDate(date);
    setSelectedTime('');
    clearFieldError('date');
    clearFieldError('time');
  };

  const handleQuickAddClient = async () => {
    if (!quickClientName.trim() || !quickClientPhone.trim()) {
      toast.error('Preencha nome e telefone do cliente');
      return;
    }

    setIsAddingClient(true);
    try {
      const newClient = await addClient({
        name: quickClientName.trim(),
        phone: quickClientPhone.trim(),
        email: quickClientEmail.trim() || undefined,
        notes: undefined,
        total_visits: 0,
        total_spent: 0,
        preferences: null,
        last_visit: null,
      });

      if (newClient) {
        setSelectedClient(newClient);
        setShowQuickAddClient(false);
        setQuickClientName('');
        setQuickClientPhone('');
        setQuickClientEmail('');
        clearFieldError('client');
        toast.success('Cliente adicionado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao adicionar cliente');
    } finally {
      setIsAddingClient(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    if (!validateForm()) {
      setIsSubmitting(false);
      toast.error('Por favor, corrija os erros antes de continuar');
      return;
    }

    try {
      const dateStr = formatDate(selectedDate!);
      const scheduledDateTime = new Date(dateStr + 'T' + selectedTime + ':00');

      const appointment = {
        client_id: selectedClient!.id,
        scheduled_date: scheduledDateTime.toISOString(),
        service_type: selectedService!.name,
        status: 'scheduled' as const,
        price: customPrice ? parseFloat(customPrice) : selectedService!.price,
        created_via: 'manual' as const,
        notes: notes || undefined,
      };

      await addAppointment(appointment);
      toast.success('Agendamento criado com sucesso!');
      
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedClient(null);
    setSelectedService(null);
    setSelectedDate(null);
    setCurrentMonth(new Date());
    setSelectedTime('');
    setCustomPrice('');
    setNotes('');
    setErrors({});
    setShowQuickAddClient(false);
    setQuickClientName('');
    setQuickClientPhone('');
    setQuickClientEmail('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getMonthName = (date: Date) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const occupiedSlots = selectedDate ? getOccupiedSlotsForDate(selectedDate) : [];
  const availableTimeSlots = selectedDate 
    ? TIME_SLOTS.filter(time => isTimeSlotAvailable(selectedDate, time))
    : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[950px] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            ✨ Novo Agendamento
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Preencha os dados abaixo para criar um novo agendamento
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          {/* Client and Service Selection */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Client Selection Card */}
            <Card className="border-2 hover:border-blue-300 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Label className="text-lg font-bold">Cliente *</Label>
                </div>

                {!showQuickAddClient ? (
                  <>
                    <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between h-14 text-left font-normal",
                            errors.client && "border-red-500 border-2",
                            selectedClient && "border-blue-500 border-2 bg-blue-50 dark:bg-blue-950/20"
                          )}
                        >
                          {selectedClient ? (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                {selectedClient.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold">{selectedClient.name}</div>
                                <div className="text-xs text-muted-foreground">{selectedClient.phone}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Selecione um cliente...</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {clients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.name}
                                  onSelect={() => {
                                    setSelectedClient(client);
                                    setClientSearchOpen(false);
                                    clearFieldError('client');
                                  }}
                                  className="py-3"
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedClient?.id === client.id ? "opacity-100" : "opacity-0")} />
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                      {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-medium">{client.name}</div>
                                      <div className="text-sm text-muted-foreground">{client.phone}</div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <Button
                      variant="outline"
                      className="w-full border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      onClick={() => setShowQuickAddClient(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar Novo Cliente
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-blue-900 dark:text-blue-100">Cadastro Rápido</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQuickAddClient(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        placeholder="Nome completo *"
                        value={quickClientName}
                        onChange={(e) => setQuickClientName(e.target.value)}
                        className="bg-white dark:bg-gray-950"
                      />
                      <Input
                        placeholder="Telefone *"
                        value={quickClientPhone}
                        onChange={(e) => setQuickClientPhone(e.target.value)}
                        className="bg-white dark:bg-gray-950"
                      />
                      <Input
                        placeholder="Email (opcional)"
                        type="email"
                        value={quickClientEmail}
                        onChange={(e) => setQuickClientEmail(e.target.value)}
                        className="bg-white dark:bg-gray-950"
                      />
                    </div>

                    <Button
                      onClick={handleQuickAddClient}
                      disabled={isAddingClient || !quickClientName.trim() || !quickClientPhone.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isAddingClient ? 'Adicionando...' : '✓ Adicionar Cliente'}
                    </Button>
                  </div>
                )}

                {errors.client && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.client}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Service Selection Card */}
            <Card className="border-2 hover:border-purple-300 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Scissors className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Label className="text-lg font-bold">Serviço *</Label>
                </div>

                <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between h-14 text-left font-normal",
                        errors.service && "border-red-500 border-2",
                        selectedService && "border-purple-500 border-2 bg-purple-50 dark:bg-purple-950/20"
                      )}
                    >
                      {selectedService ? (
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-semibold">{selectedService.name}</span>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900">
                              {selectedService.duration_minutes}min
                            </Badge>
                            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">
                              R$ {selectedService.price.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Selecione um serviço...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar serviço..." />
                      <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {services.map((service) => (
                            <CommandItem
                              key={service.id}
                              value={service.name}
                              onSelect={() => {
                                setSelectedService(service);
                                setServiceSearchOpen(false);
                                setSelectedTime('');
                                clearFieldError('service');
                              }}
                              className="py-3"
                            >
                              <Check className={cn("mr-2 h-4 w-4", selectedService?.id === service.id ? "opacity-100" : "opacity-0")} />
                              <div className="flex-1">
                                <div className="font-medium">{service.name}</div>
                                <div className="text-sm text-muted-foreground flex gap-2">
                                  <span>💰 R$ {service.price.toFixed(2)}</span>
                                  <span>•</span>
                                  <span>⏱️ {service.duration_minutes} min</span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {errors.service && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.service}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calendar Section */}
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Label className="text-lg font-bold">Selecione a Data *</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-base font-semibold min-w-[180px] text-center">
                      {getMonthName(currentMonth)}
                    </span>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

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
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const appointmentsCount = getAppointmentsCountForDate(day);
                    const hasAppointments = appointmentsCount > 0 && isCurrentMonth && !isPast;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleDateClick(day)}
                        disabled={!isCurrentMonth || isPast}
                        className={cn(
                          "relative aspect-square rounded-xl p-2 text-sm font-medium transition-all",
                          !isCurrentMonth && "text-muted-foreground/30 cursor-not-allowed",
                          isPast && isCurrentMonth && "text-muted-foreground/50 cursor-not-allowed bg-muted/30",
                          isCurrentMonth && !isPast && "hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer bg-muted/50 hover:scale-105 hover:shadow-md",
                          isToday && "ring-2 ring-blue-500 font-bold",
                          isSelected && "bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg scale-105 font-bold"
                        )}
                      >
                        <div className="text-center">{day.getDate()}</div>
                        
                        {hasAppointments && !isSelected && (
                          <div className="absolute top-1 right-1">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" 
                                 title={`${appointmentsCount} agendamento(s)`} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {errors.date && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.date}
                  </p>
                )}

                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-muted/50 border" />
                    <span>Disponível</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
                    <span>Selecionado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-muted/50 border relative">
                      <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-orange-500" />
                    </div>
                    <span>Com agendamentos</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Selection */}
          {selectedDate && (
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <Label className="text-lg font-bold">Escolha o Horário *</Label>
                  </div>

                  <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      📅 {formatDateDisplay(selectedDate)}
                    </p>
                  </div>

                  {occupiedSlots.length > 0 && (
                    <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                              Horários já ocupados:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {occupiedSlots.map(time => (
                                <Badge key={time} variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                                  {time}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {formatDate(selectedDate) === formatDate(today) && (
                    <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>⚡ Agendamento para hoje:</strong> Apenas horários com margem de 30min a partir de agora ({new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}) estão disponíveis.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Select 
                    value={selectedTime} 
                    onValueChange={(value) => {
                      setSelectedTime(value);
                      clearFieldError('time');
                    }}
                  >
                    <SelectTrigger className={cn("h-16 text-lg font-medium", errors.time && "border-red-500 border-2")}>
                      <SelectValue placeholder="⏰ Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableTimeSlots.length === 0 ? (
                        <div className="p-6 text-center">
                          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                          <p className="text-sm text-muted-foreground font-medium">
                            Nenhum horário disponível para esta data
                          </p>
                        </div>
                      ) : (
                        availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time} className="h-14 cursor-pointer">
                            <div className="flex items-center justify-between w-full">
                              <span className="font-mono font-bold text-lg">{time}</span>
                              {selectedService && (
                                <Badge variant="secondary" className="ml-4 bg-purple-100 dark:bg-purple-900">
                                  {selectedService.duration_minutes}min
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {errors.time && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.time}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Custom Price */}
            <Card className="border-2 hover:border-green-300 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <Label className="text-lg font-bold">Preço Personalizado</Label>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={selectedService ? `Padrão: R$ ${selectedService.price.toFixed(2)}` : "R$ 0.00"}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="h-14 text-lg"
                />
                {selectedService && (
                  <p className="text-sm text-muted-foreground">
                    💡 Valor padrão do serviço: <strong>R$ {selectedService.price.toFixed(2)}</strong>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-2 hover:border-yellow-300 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <Label className="text-lg font-bold">Observações</Label>
                </div>
                <Textarea
                  placeholder="Adicione observações sobre o agendamento..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t gap-4">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isSubmitting}
            className="h-14 px-8 text-base"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !selectedClient || !selectedService || !selectedDate || !selectedTime}
            className="h-14 px-8 text-base bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Criando...
              </>
            ) : (
              <>✨ Criar Agendamento</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}