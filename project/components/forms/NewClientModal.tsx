// @ts-nocheck
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Phone, Mail, FileText, User } from 'lucide-react';
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
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto !bg-zinc-950 dark:!bg-zinc-950 border-zinc-800 shadow-2xl"
        style={{ 
          backgroundColor: '#09090b',
          backgroundImage: 'none',
          opacity: 1,
          zIndex: 50,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-white">
            <UserPlus className="h-6 w-6 text-blue-500" />
            Novo Cliente
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-zinc-400">
            Adicione um novo cliente à base de dados
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <User className="h-4 w-4" />
              Nome <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo do cliente"
              className="!bg-zinc-900 border-zinc-800 text-sm text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <Phone className="h-4 w-4" />
              Telefone <span className="text-red-400">*</span>
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              className="!bg-zinc-900 border-zinc-800 text-sm text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <Mail className="h-4 w-4" />
              Email (opcional)
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="!bg-zinc-900 border-zinc-800 text-sm text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <FileText className="h-4 w-4" />
              Observações (opcional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferências, alergias, observações..."
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
            onClick={handleSubmit}
            className="w-full sm:w-auto text-sm bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Cliente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}