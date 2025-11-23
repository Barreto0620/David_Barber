// @ts-nocheck
// components/clients/ClientEditDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Trash2, User, Phone, Mail, FileText, Edit3 } from 'lucide-react';
import type { Client } from '@/types/database';

interface ClientEditDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientEditDialog({ client, open, onOpenChange }: ClientEditDialogProps) {
  const { updateClient, deleteClient } = useAppStore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when client changes or dialog opens
  useEffect(() => {
    if (client && open) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        notes: client.notes || ''
      });
      setErrors({});
    }
  }, [client, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else {
      // Basic phone validation
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Telefone deve conter apenas números e símbolos válidos';
      }
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email deve ter um formato válido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client || !validateForm()) return;

    setIsLoading(true);

    try {
      // Update client data
      const updatedData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        notes: formData.notes.trim() || undefined
      };

      const success = await updateClient(client.id, updatedData);

      if (success) {
        toast({
          title: "Cliente atualizado",
          description: "As informações do cliente foram salvas com sucesso.",
        });
        onOpenChange(false);
      } else {
        throw new Error('Falha ao atualizar cliente');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as informações do cliente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;

    setIsDeleting(true);

    try {
      const success = await deleteClient(client.id);

      if (success) {
        toast({
          title: "Cliente excluído",
          description: "O cliente foi removido com sucesso.",
        });
        setShowDeleteAlert(false);
        onOpenChange(false);
      } else {
        throw new Error('Falha ao excluir cliente');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o cliente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatPhone = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length <= 10) {
      // Format as (XX) XXXX-XXXX
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (match, p1, p2, p3) => {
        if (p3) return `(${p1}) ${p2}-${p3}`;
        if (p2) return `(${p1}) ${p2}`;
        if (p1) return `(${p1}`;
        return digits;
      });
    } else {
      // Format as (XX) 9XXXX-XXXX
      return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (match, p1, p2, p3) => {
        if (p3) return `(${p1}) ${p2}-${p3}`;
        if (p2) return `(${p1}) ${p2}`;
        if (p1) return `(${p1}`;
        return digits;
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({
      ...prev,
      phone: formatted
    }));
    
    if (errors.phone) {
      setErrors(prev => ({
        ...prev,
        phone: ''
      }));
    }
  };

  if (!client) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto !bg-zinc-950 dark:!bg-zinc-950 border-zinc-800 shadow-2xl"
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
              <Edit3 className="h-6 w-6 text-blue-500" />
              Editar Cliente
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-zinc-400">
              Altere as informações do cliente. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <User className="h-4 w-4" />
                Nome completo <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="Digite o nome completo"
                className={`!bg-zinc-900 border-zinc-800 text-sm text-white placeholder:text-zinc-500 ${
                  errors.name ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Phone className="h-4 w-4" />
                Telefone <span className="text-red-400">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                className={`!bg-zinc-900 border-zinc-800 text-sm text-white placeholder:text-zinc-500 ${
                  errors.phone ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-red-400">{errors.phone}</p>
              )}
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
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="cliente@email.com"
                className={`!bg-zinc-900 border-zinc-800 text-sm text-white placeholder:text-zinc-500 ${
                  errors.email ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <FileText className="h-4 w-4" />
                Observações (opcional)
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Preferências, anotações importantes..."
                className="min-h-[100px] resize-none !bg-zinc-900 border-zinc-800 text-sm text-white placeholder:text-zinc-500"
                disabled={isLoading}
              />
            </div>

            {/* Footer */}
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isDeleting}
                className="w-full sm:w-auto text-sm order-3 sm:order-1"
              >
                Cancelar
              </Button>
              
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteAlert(true)}
                disabled={isLoading || isDeleting}
                className="w-full sm:w-auto text-sm order-2"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Cliente
              </Button>

              <Button
                type="submit"
                disabled={isLoading || isDeleting || !formData.name.trim() || !formData.phone.trim()}
                className="w-full sm:w-auto text-sm bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-3"
              >
                {isLoading ? 'Salvando...' : 'Salvar Informações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent
          className="!bg-zinc-950 dark:!bg-zinc-950 border-zinc-800"
          style={{ 
            backgroundColor: '#09090b',
            backgroundImage: 'none'
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-white">
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-400">
              Tem certeza que deseja excluir <strong className="text-white">{client.name}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita. Todos os agendamentos e histórico deste cliente também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel 
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}