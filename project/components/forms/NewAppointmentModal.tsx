// @ts-nocheck
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { Client, Service } from '@/types/database';
import { toast } from 'sonner';

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

export function NewAppointmentModal({ open, onClose, onSuccess }: NewAppointmentModalProps) {
  const { clients, services, appointments, addAppointment } = useAppStore();
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gerar próximos 30 dias
  const getAvailableDates = () => {
    const dates = [];
    const hoje = new Date();
    
    for (let i = 0; i < 30; i++) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);
      
      const valor = data.toISOString().split('T')[0]; // YYYY-MM-DD
      const texto = data.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
      
      // Destacar hoje e amanhã
      let prefixo = '';
      if (i === 0) prefixo = '🔥 HOJE - ';
      if (i === 1) prefixo = '⭐ AMANHÃ - ';
      
      dates.push({ valor, texto: prefixo + texto });
    }
    return dates;
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  // Verificar conflitos de horário
  const isTimeSlotAvailable = (timeSlot: string) => {
    if (!selectedService || !selectedDate) return true;

    const [hours, minutes] = timeSlot.split(':').map(Number);
    const proposedDateTime = new Date(selectedDate + 'T00:00:00');
    proposedDateTime.setHours(hours, minutes, 0, 0);

    // Se for hoje, verificar se o horário já passou
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];
    
    if (selectedDate === hoje) {
      const horarioAtualEmMinutos = agora.getHours() * 60 + agora.getMinutes();
      const horarioPropostoEmMinutos = hours * 60 + minutes;
      
      // Margem de 30 minutos
      if (horarioPropostoEmMinutos <= horarioAtualEmMinutos + 30) {
        return false;
      }
    }

    // Verificar conflitos com agendamentos existentes
    const dayStart = new Date(selectedDate + 'T00:00:00');
    const dayEnd = new Date(selectedDate + 'T23:59:59');

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

  // Validação completa do formulário
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!selectedClient) newErrors.client = 'Selecione um cliente';
    if (!selectedService) newErrors.service = 'Selecione um serviço';
    if (!selectedDate) newErrors.date = 'Selecione uma data';
    if (!selectedTime) newErrors.time = 'Selecione um horário';

    // Verificar se horário está disponível
    if (selectedService && selectedDate && selectedTime) {
      if (!isTimeSlotAvailable(selectedTime)) {
        newErrors.time = `Horário ${selectedTime} não disponível - conflito com outro agendamento`;
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    if (!validateForm()) {
      setIsSubmitting(false);
      toast.error('Por favor, corrija os erros antes de continuar');
      return;
    }

    try {
      const scheduledDateTime = new Date(selectedDate + 'T' + selectedTime + ':00');

      const appointment = {
        id: `apt_${Date.now()}`,
        client_id: selectedClient!.id,
        scheduled_date: scheduledDateTime.toISOString(),
        service_type: selectedService!.name,
        status: 'scheduled' as const,
        price: customPrice ? parseFloat(customPrice) : selectedService!.price,
        created_via: 'manual' as const,
        notes: notes || undefined,
      };

      addAppointment(appointment);
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
    setSelectedDate('');
    setSelectedTime('');
    setCustomPrice('');
    setNotes('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const availableTimeSlots = timeSlots.filter(isTimeSlotAvailable);

  // Info sobre ocupação do dia
  const getDayOccupancyInfo = () => {
    if (!selectedDate) return null;
    
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
    
    const occupiedSlots = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.scheduled_date);
      return appointmentDate >= dayStart && appointmentDate <= dayEnd && appointment.status !== 'cancelled';
    });
    
    if (occupiedSlots.length === 0) return null;
    
    return occupiedSlots.map(appointment => {
      const time = new Date(appointment.scheduled_date).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${time} (${appointment.service_type})`;
    });
  };

  const occupancyInfo = getDayOccupancyInfo();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Crie um novo agendamento para a barbearia
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Client Selection */}
          <div className="grid gap-2">
            <Label>Cliente *</Label>
            <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("justify-between", errors.client && "border-red-500")}
                >
                  {selectedClient ? selectedClient.name : "Selecione um cliente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedClient?.id === client.id ? "opacity-100" : "opacity-0")} />
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground">{client.phone}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.client && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.client}
              </p>
            )}
          </div>

          {/* Service Selection */}
          <div className="grid gap-2">
            <Label>Serviço *</Label>
            <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("justify-between", errors.service && "border-red-500")}
                >
                  {selectedService ? selectedService.name : "Selecione um serviço..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                            setSelectedTime(''); // Reset time when service changes
                            clearFieldError('service');
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedService?.id === service.id ? "opacity-100" : "opacity-0")} />
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">
                              R$ {service.price.toFixed(2)} • {service.duration_minutes} min
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
          </div>

          {/* Date Selection - Dropdown simples */}
          <div className="grid gap-2">
            <Label>Data *</Label>
            <Select 
              value={selectedDate} 
              onValueChange={(value) => {
                setSelectedDate(value);
                setSelectedTime(''); // Reset time when date changes
                clearFieldError('date');
              }}
            >
              <SelectTrigger className={cn(errors.date && "border-red-500")}>
                <SelectValue placeholder="Selecione uma data" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableDates().map((date) => (
                  <SelectItem key={date.valor} value={date.valor}>
                    {date.texto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.date && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.date}
              </p>
            )}
          </div>

          {/* Time Selection */}
          <div className="grid gap-2">
            <Label>Horário *</Label>
            <Select 
              value={selectedTime} 
              onValueChange={(value) => {
                setSelectedTime(value);
                clearFieldError('time');
              }}
            >
              <SelectTrigger className={cn(errors.time && "border-red-500")}>
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent>
                {availableTimeSlots.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Nenhum horário disponível
                  </div>
                ) : (
                  availableTimeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                      {selectedService && (
                        <span className="text-muted-foreground text-xs ml-2">
                          ({selectedService.duration_minutes}min)
                        </span>
                      )}
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
            
            {/* Info sobre ocupação do dia */}
            {occupancyInfo && occupancyInfo.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm font-medium text-amber-800">
                  Agendamentos neste dia:
                </p>
                <div className="mt-1 space-y-1">
                  {occupancyInfo.map((info, index) => (
                    <p key={index} className="text-xs text-amber-700">
                      • {info}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Info especial para hoje */}
            {selectedDate === new Date().toISOString().split('T')[0] && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Agendamento para hoje:</strong> Apenas horários com margem de 30 min a partir de agora ({new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}) estão disponíveis.
                </p>
              </div>
            )}
          </div>

          {/* Custom Price */}
          <div className="grid gap-2">
            <Label>Preço Personalizado (opcional)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder={selectedService ? `Padrão: R$ ${selectedService.price.toFixed(2)}` : "0.00"}
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Adicione observações sobre o agendamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar Agendamento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}