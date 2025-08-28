'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import type { Client } from '@/types/database';
import { toast } from 'sonner';

interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewClientModal({ open, onClose, onSuccess }: NewClientModalProps) {
  const { addClient, clients } = useAppStore();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XX) XXXXX-XXXX
    if (digits.length <= 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return digits.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    // Check if phone already exists
    const phoneExists = clients.some(client => client.phone === phone);
    if (phoneExists) {
      toast.error('Já existe um cliente com este telefone');
      return;
    }

    const newClient: Client = {
      id: `client_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      created_at: new Date().toISOString(),
      total_visits: 0,
      total_spent: 0,
      notes: notes.trim() || undefined,
    };

    addClient(newClient);
    toast.success('Cliente adicionado com sucesso!');
    
    // Reset form
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Adicione um novo cliente à base de dados
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo do cliente"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferências, alergias, observações..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Adicionar Cliente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}