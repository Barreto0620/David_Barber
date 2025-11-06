// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Scissors,
  Plus,
  Trash2,
  DollarSign,
  Clock,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  fetchServices, 
  createService, 
  deleteService, 
  toggleServiceActive,
  type Service
} from '@/lib/supabase';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Service form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');

  // Carregar serviços ao montar o componente
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await fetchServices();
      setServices(data);
    } catch (error) {
      toast.error('Erro ao carregar serviços');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!newServiceName || !newServicePrice || !newServiceDuration) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      
      const newService = await createService({
        name: newServiceName,
        price: parseFloat(newServicePrice),
        duration_minutes: parseInt(newServiceDuration),
        description: newServiceDescription || undefined,
        active: true,
      });

      setServices([...services, newService]);
      
      // Reset form
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDuration('');
      setNewServiceDescription('');
      
      toast.success('Serviço adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar serviço');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleService = async (serviceId: string, currentActive: boolean) => {
    try {
      await toggleServiceActive(serviceId, !currentActive);
      
      const updatedServices = services.map(service =>
        service.id === serviceId 
          ? { ...service, active: !currentActive }
          : service
      );
      setServices(updatedServices);
      
      toast.success('Status do serviço atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar serviço');
      console.error(error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) {
      return;
    }

    try {
      await deleteService(serviceId);
      
      const updatedServices = services.filter(service => service.id !== serviceId);
      setServices(updatedServices);
      
      toast.success('Serviço removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover serviço');
      console.error(error);
    }
  };

  // Estatísticas
  const activeServices = services.filter(s => s.active).length;
  const totalRevenue = services
    .filter(s => s.active)
    .reduce((sum, s) => sum + s.price, 0);
  const averagePrice = activeServices > 0 
    ? totalRevenue / activeServices 
    : 0;
  const averageDuration = services.length > 0
    ? Math.round(
        services.reduce((sum, s) => sum + s.duration_minutes, 0) / services.length
      )
    : 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pela barbearia
          </p>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={loadServices}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Serviços Ativos
            </CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices}</div>
            <p className="text-xs text-muted-foreground">
              de {services.length} serviços totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Preço Médio
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {averagePrice.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              média dos serviços ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Duração Média
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageDuration} min
            </div>
            <p className="text-xs text-muted-foreground">
              tempo médio por serviço
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add New Service */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Adicionar Novo Serviço</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="serviceName">
                Nome do Serviço <span className="text-red-500">*</span>
              </Label>
              <Input
                id="serviceName"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Ex: Corte Degradê"
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="servicePrice">
                Preço (R$) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="servicePrice"
                type="number"
                step="0.01"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                placeholder="25.00"
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="serviceDuration">
                Duração (minutos) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="serviceDuration"
                type="number"
                value={newServiceDuration}
                onChange={(e) => setNewServiceDuration(e.target.value)}
                placeholder="30"
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="serviceDescription">Descrição</Label>
              <Input
                id="serviceDescription"
                value={newServiceDescription}
                onChange={(e) => setNewServiceDescription(e.target.value)}
                placeholder="Descrição opcional"
                disabled={submitting}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAddService} 
            className="w-full mt-4"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Services */}
      <Card>
        <CardHeader>
          <CardTitle>Serviços Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h3>
              <p className="text-muted-foreground">
                Adicione seu primeiro serviço usando o formulário acima
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {services.map((service) => (
                <div 
                  key={service.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Scissors className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{service.name}</h4>
                          <Badge variant={service.active ? "default" : "secondary"}>
                            {service.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            R$ {service.price.toFixed(2)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {service.duration_minutes} min
                          </span>
                          {service.description && (
                            <span className="text-xs">• {service.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={service.active}
                      onCheckedChange={() => handleToggleService(service.id, service.active)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteService(service.id)}
                      className="h-9 w-9 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}