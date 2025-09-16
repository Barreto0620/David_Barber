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
import { Sidebar } from '@/components/layout/Sidebar';
import { UserMenu } from '@/components/layout/UserMenu';
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
  
  // Service management
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');

  const handleSaveBusinessSettings = () => {
    // In a real implementation, this would save to database
    toast.success('Configurações da empresa salvas com sucesso!');
  };

  const handleSaveNotificationSettings = () => {
    // In a real implementation, this would save to database
    toast.success('Configurações de notificação salvas com sucesso!');
  };

  const handleAddService = () => {
    if (!newServiceName || !newServicePrice || !newServiceDuration) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const newService = {
      id: `service_${Date.now()}`,
      name: newServiceName,
      price: parseFloat(newServicePrice),
      duration_minutes: parseInt(newServiceDuration),
      description: newServiceDescription || undefined,
      active: true,
      created_at: new Date().toISOString(),
    };

    setServices([...services, newService]);
    
    // Reset form
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDuration('');
    setNewServiceDescription('');
    
    toast.success('Serviço adicionado com sucesso!');
  };

  const handleToggleService = (serviceId: string) => {
    const updatedServices = services.map(service =>
      service.id === serviceId 
        ? { ...service, active: !service.active }
        : service
    );
    setServices(updatedServices);
    toast.success('Status do serviço atualizado!');
  };

  const handleDeleteService = (serviceId: string) => {
    const updatedServices = services.filter(service => service.id !== serviceId);
    setServices(updatedServices);
    toast.success('Serviço removido com sucesso!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                  <p className="text-muted-foreground">
                    Gerencie as configurações da barbearia
                  </p>
                </div>
                <UserMenu />
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

              {/* Services Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="h-5 w-5" />
                    <span>Gerenciar Serviços</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New Service */}
                  <div className="grid gap-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Adicionar Novo Serviço</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="serviceName">Nome do Serviço</Label>
                        <Input
                          id="serviceName"
                          value={newServiceName}
                          onChange={(e) => setNewServiceName(e.target.value)}
                          placeholder="Ex: Corte Degradê"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="servicePrice">Preço (R$)</Label>
                        <Input
                          id="servicePrice"
                          type="number"
                          step="0.01"
                          value={newServicePrice}
                          onChange={(e) => setNewServicePrice(e.target.value)}
                          placeholder="25.00"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="serviceDuration">Duração (minutos)</Label>
                        <Input
                          id="serviceDuration"
                          type="number"
                          value={newServiceDuration}
                          onChange={(e) => setNewServiceDuration(e.target.value)}
                          placeholder="30"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="serviceDescription">Descrição</Label>
                        <Input
                          id="serviceDescription"
                          value={newServiceDescription}
                          onChange={(e) => setNewServiceDescription(e.target.value)}
                          placeholder="Descrição opcional"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={handleAddService} className="w-full">
                      Adicionar Serviço
                    </Button>
                  </div>

                  {/* Existing Services */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Serviços Existentes</h3>
                    <div className="grid gap-3">
                      {services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{service.name}</h4>
                              <Badge variant={service.active ? "default" : "secondary"}>
                                {service.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                              <span>R$ {service.price.toFixed(2)}</span>
                              <span>{service.duration_minutes} min</span>
                              {service.description && <span>{service.description}</span>}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={service.active}
                              onCheckedChange={() => handleToggleService(service.id)}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteService(service.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

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
          </div>
        </main>
      </div>
    </div>
  );
}