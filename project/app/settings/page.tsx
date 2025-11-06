// @ts-nocheck
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Store, 
  Clock, 
  Bell, 
  Smartphone,
  Save,
  Trash2
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { services, setServices } = useAppStore();
  
  // Business settings
  const [businessName, setBusinessName] = useState('David Barber');
  const [businessPhone, setBusinessPhone] = useState('(11) 99999-0000');
  const [businessAddress, setBusinessAddress] = useState('Rua das Flores, 123 - São Paulo, SP');
  const [businessHours, setBusinessHours] = useState('08:00 - 20:00');
  
  // Notification settings
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderHours, setReminderHours] = useState('24');

  const handleSaveBusinessSettings = () => {
    // In a real implementation, this would save to database
    toast.success('Configurações da empresa salvas com sucesso!');
  };

  const handleSaveNotificationSettings = () => {
    // In a real implementation, this would save to database
    toast.success('Configurações de notificação salvas com sucesso!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da barbearia
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <span>Informações da Empresa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="businessName">Nome da Barbearia</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="businessPhone">Telefone</Label>
              <Input
                id="businessPhone"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="businessAddress">Endereço</Label>
              <Textarea
                id="businessAddress"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="businessHours">Horário de Funcionamento</Label>
              <Input
                id="businessHours"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="08:00 - 20:00"
              />
            </div>

            <Button onClick={handleSaveBusinessSettings} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notificações</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>WhatsApp Business</Label>
                <p className="text-sm text-muted-foreground">
                  Integração com WhatsApp para agendamentos
                </p>
              </div>
              <Switch
                checked={whatsappEnabled}
                onCheckedChange={setWhatsappEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Lembretes Automáticos</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar lembretes antes dos agendamentos
                </p>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {reminderEnabled && (
              <div className="grid gap-2">
                <Label htmlFor="reminderHours">Horas antes do agendamento</Label>
                <Input
                  id="reminderHours"
                  type="number"
                  value={reminderHours}
                  onChange={(e) => setReminderHours(e.target.value)}
                  min="1"
                  max="72"
                />
              </div>
            )}

            <Button onClick={handleSaveNotificationSettings} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Notificações
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Status das Integrações</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">WhatsApp Business API</p>
              <p className="text-sm text-muted-foreground">
                Integração via n8n para agendamentos automáticos
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Configurado
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Supabase Database</p>
              <p className="text-sm text-muted-foreground">
                Banco de dados para clientes e agendamentos
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Conectado
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">n8n Automation</p>
              <p className="text-sm text-muted-foreground">
                Automação de workflows e notificações
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Ativo
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}