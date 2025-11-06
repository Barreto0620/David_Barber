// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { Appointment, Client, Service } from '@/lib/supabase';

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  selectedDate: Date | null;
  clients: Client[];
  services: Service[];
  onSave: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function AppointmentModal({
  open,
  onOpenChange,
  appointment,
  selectedDate,
  clients,
  services,
  onSave,
  onDelete,
}: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: 'none',
    scheduled_date: '',
    scheduled_time: '',
    service_type: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    price: '',
    payment_method: 'none' as 'none' | 'dinheiro' | 'cartao' | 'pix' | 'transferencia',
    notes: '',
  });

  // Configurações de horário de funcionamento
  const HORARIO_ABERTURA = '08:00';
  const HORARIO_FECHAMENTO = '20:00';
  const INTERVALO_MINUTOS = 30; // Intervalos de 30 minutos

  // Data mínima (hoje)
  const minDate = format(new Date(), 'yyyy-MM-dd');

  // Gerar horários disponíveis
  const generateAvailableHours = () => {
    const hours: string[] = [];
    const [startHour, startMinute] = HORARIO_ABERTURA.split(':').map(Number);
    const [endHour, endMinute] = HORARIO_FECHAMENTO.split(':').map(Number);
    
    let currentTime = startHour * 60 + startMinute; // Converter para minutos
    const endTime = endHour * 60 + endMinute;
    
    while (currentTime < endTime) {
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      hours.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      currentTime += INTERVALO_MINUTOS;
    }
    
    return hours;
  };

  const availableHours = generateAvailableHours();

  useEffect(() => {
    if (appointment) {
      const aptDate = parseISO(appointment.scheduled_date);
      setFormData({
        client_id: appointment.client_id || 'none',
        scheduled_date: format(aptDate, 'yyyy-MM-dd'),
        scheduled_time: format(aptDate, 'HH:mm'),
        service_type: appointment.service_type,
        status: appointment.status,
        price: appointment.price.toString(),
        payment_method: appointment.payment_method || 'none',
        notes: appointment.notes || '',
      });
    } else if (selectedDate) {
      setFormData({
        client_id: 'none',
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        scheduled_time: format(selectedDate, 'HH:mm'),
        service_type: '',
        status: 'scheduled',
        price: '',
        payment_method: 'none',
        notes: '',
      });
    } else {
      setFormData({
        client_id: 'none',
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        scheduled_time: '09:00',
        service_type: '',
        status: 'scheduled',
        price: '',
        payment_method: 'none',
        notes: '',
      });
    }
  }, [appointment, selectedDate, open]);

  const handleServiceChange = (serviceType: string) => {
    const service = services.find((s) => s.name === serviceType);
    setFormData({
      ...formData,
      service_type: serviceType,
      price: service ? service.price.toString() : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar data não pode ser no passado
      const selectedDate = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      const now = new Date();
      
      if (selectedDate < now && !appointment) {
        toast.error('Não é possível agendar em datas/horários passados');
        setLoading(false);
        return;
      }

      // Validar horário dentro do horário de funcionamento
      const [hour, minute] = formData.scheduled_time.split(':').map(Number);
      const [startHour, startMinute] = HORARIO_ABERTURA.split(':').map(Number);
      const [endHour, endMinute] = HORARIO_FECHAMENTO.split(':').map(Number);
      
      const timeInMinutes = hour * 60 + minute;
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      if (timeInMinutes < startTimeInMinutes || timeInMinutes >= endTimeInMinutes) {
        toast.error(`Horário deve estar entre ${HORARIO_ABERTURA} e ${HORARIO_FECHAMENTO}`);
        setLoading(false);
        return;
      }

      const scheduled_date = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
      
      const data: any = {
        scheduled_date,
        service_type: formData.service_type,
        status: formData.status,
        price: parseFloat(formData.price),
        notes: formData.notes || null,
      };

      // Adicionar client_id apenas se houver um cliente selecionado
      if (formData.client_id && formData.client_id !== 'none') {
        data.client_id = formData.client_id;
      } else {
        data.client_id = null;
      }

      // Adicionar payment_method apenas se houver um método selecionado
      if (formData.payment_method && formData.payment_method !== 'none') {
        data.payment_method = formData.payment_method;
      } else {
        data.payment_method = null;
      }

      if (!appointment) {
        data.created_via = 'manual';
      }

      await onSave(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (appointment && confirm('Tem certeza que deseja excluir este agendamento?')) {
      setLoading(true);
      try {
        await onDelete(appointment.id);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <DialogDescription>
            {appointment
              ? 'Atualize as informações do agendamento'
              : 'Preencha os dados para criar um novo agendamento'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">
                Data <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                min={minDate}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_date: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Não é possível agendar em datas passadas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time">
                Horário <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.scheduled_time}
                onValueChange={(value) =>
                  setFormData({ ...formData, scheduled_time: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {availableHours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Horário de funcionamento: {HORARIO_ABERTURA} às {HORARIO_FECHAMENTO}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente (Opcional)</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) =>
                setFormData({ ...formData, client_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem cliente</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_type">Serviço *</Label>
            <Select
              value={formData.service_type}
              onValueChange={handleServiceChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services
                  .filter((s) => s.active)
                  .map((service) => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name} - R$ {service.price.toFixed(2)} (
                      {service.duration_minutes} min)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pagamento</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value: any) =>
                setFormData({ ...formData, payment_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não definido</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            {appointment && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}