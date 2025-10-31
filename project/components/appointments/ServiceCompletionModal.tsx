// @ts-nocheck
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Appointment, PaymentMethod } from '@/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { useAppStore } from '@/lib/store';

interface ServiceCompletionModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onComplete: (paymentMethod: PaymentMethod, finalPrice: number, notes?: string) => void;
}

export function ServiceCompletionModal({ 
  appointment, 
  open, 
  onClose, 
  onComplete 
}: ServiceCompletionModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [finalPrice, setFinalPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const getClientById = useAppStore((state) => state.getClientById);

  const handleComplete = () => {
    if (!appointment) return;
    
    const price = finalPrice ? parseFloat(finalPrice) : appointment.price;
    onComplete(paymentMethod, price, notes || undefined);
    
    // Reset form
    setPaymentMethod('pix');
    setFinalPrice('');
    setNotes('');
    onClose();
  };

  if (!appointment) return null;

  const client = getClientById(appointment.client_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Finalizar Atendimento</DialogTitle>
          <DialogDescription>
            Confirme os detalhes do serviço realizado para {client?.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Serviço</Label>
            <div className="p-2 bg-muted rounded-md">
              <p className="font-medium">{appointment.service_type}</p>
              <p className="text-sm text-muted-foreground">
                Valor original: {formatCurrency(appointment.price)}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="finalPrice">Valor Final (opcional)</Label>
            <Input
              id="finalPrice"
              type="number"
              step="0.01"
              placeholder={appointment.price.toString()}
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre o atendimento..."
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
          <Button onClick={handleComplete}>
            Finalizar Atendimento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}