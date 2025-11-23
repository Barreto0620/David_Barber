// @ts-nocheck
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, DollarSign, CreditCard, FileText } from 'lucide-react';
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
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-zinc-800 shadow-2xl"
        style={{ 
          backgroundColor: '#09090b',
          backgroundImage: 'none',
          opacity: 1,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-white">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Finalizar Atendimento
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-zinc-400">
            Confirme os detalhes do serviço realizado para {client?.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Informações do Serviço */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-200">Serviço</Label>
            <div className="p-3 !bg-zinc-900 border border-zinc-800 rounded-lg">
              <p className="font-medium text-base text-white">{appointment.service_type}</p>
              <p className="text-sm text-zinc-400 mt-1">
                Valor original: {formatCurrency(appointment.price)}
              </p>
            </div>
          </div>

          {/* Valor Final */}
          <div className="space-y-2">
            <Label htmlFor="finalPrice" className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <DollarSign className="h-4 w-4" />
              Valor Final (opcional)
            </Label>
            <Input
              id="finalPrice"
              type="number"
              step="0.01"
              placeholder={appointment.price.toString()}
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              className="!bg-zinc-900 border-zinc-800 text-sm text-white placeholder:text-zinc-500"
            />
            <p className="text-xs text-zinc-500">
              Deixe em branco para usar o valor original
            </p>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <CreditCard className="h-4 w-4" />
              Forma de Pagamento <span className="text-red-400">*</span>
            </Label>
            <Select 
              value={paymentMethod} 
              onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
            >
              <SelectTrigger className="!bg-zinc-900 border-zinc-800 text-sm text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!bg-zinc-900 border-zinc-800">
                <SelectItem value="dinheiro" className="text-sm text-white hover:!bg-zinc-800 focus:!bg-zinc-800">
                  💵 Dinheiro
                </SelectItem>
                <SelectItem value="cartao" className="text-sm text-white hover:!bg-zinc-800 focus:!bg-zinc-800">
                  💳 Cartão
                </SelectItem>
                <SelectItem value="pix" className="text-sm text-white hover:!bg-zinc-800 focus:!bg-zinc-800">
                  📱 PIX
                </SelectItem>
                <SelectItem value="transferencia" className="text-sm text-white hover:!bg-zinc-800 focus:!bg-zinc-800">
                  🏦 Transferência
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <FileText className="h-4 w-4" />
              Observações (opcional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre o atendimento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="min-h-[80px] resize-none !bg-zinc-900 border-zinc-800 text-sm text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Footer com botões */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-zinc-800">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto text-sm"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleComplete}
            className="w-full sm:w-auto text-sm bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Finalizar Atendimento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}