'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { Client, Service } from '@/types/database';
import { toast } from 'sonner';

interface NewAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewAppointmentModal({ open, onClose, onSuccess }: NewAppointmentModalProps) {
  const { clients, services, addAppointment } = useAppStore();
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  const handleSubmit = () => {
    if (!selectedClient || !selectedService || !selectedDate || !selectedTime) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const scheduledDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const appointment = {
      id: `apt_${Date.now()}`,
      client_id: selectedClient.id,
      client: selectedClient,
      scheduled_date: scheduledDateTime.toISOString(),
      service_type: selectedService.name,
      status: 'scheduled' as const,
      price: customPrice ? parseFloat(customPrice) : selectedService.price,
      created_via: 'manual' as const,
      notes: notes || undefined,
    };

    addAppointment(appointment);
    toast.success('Agendamento criado com sucesso!');
    
    // Reset form
    setSelectedClient(null);
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime('');
    setCustomPrice('');
    setNotes('');
    
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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
                  aria-expanded={clientSearchOpen}
                  className="justify-between"
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
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                            )}
                          />
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
          </div>

          {/* Service Selection */}
          <div className="grid gap-2">
            <Label>Serviço *</Label>
            <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={serviceSearchOpen}
                  className="justify-between"
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
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedService?.id === service.id ? "opacity-100" : "opacity-0"
                            )}
                          />
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
          </div>

          {/* Date Selection */}
          <div className="grid gap-2">
            <Label>Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid gap-2">
            <Label>Horário *</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Price */}
          <div className="grid gap-2">
            <Label>Preço Personalizado (opcional)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder={selectedService ? `R$ ${selectedService.price.toFixed(2)}` : "0.00"}
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
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Criar Agendamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}