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
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  fetchServices, 
  createService, 
  deleteService, 
  toggleServiceActive,
  type Service
} from '@/lib/supabase';
import { cn } from '@/lib/utils';

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
      <div className="p-3 sm:p-4 md:p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 pb-20 sm:pb-6">
      {/* Header - Otimizado para Mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Serviços
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gerencie os serviços oferecidos pela barbearia
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={loadServices}
          disabled={loading}
          className="self-end sm:self-auto h-10 w-10 flex-shrink-0 active:scale-90 transition-transform touch-manipulation"
          aria-label="Recarregar serviços"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Statistics Cards - Grid Responsivo */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 xs:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Serviços Ativos
            </CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{activeServices}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              de {services.length} totais
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Preço Médio
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold truncate">
              R$ {averagePrice.toFixed(2)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              média dos ativos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Duração Média
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">
              {averageDuration} min
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              tempo médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add New Service - Formulário Otimizado */}
      <Card className="shadow-sm">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="truncate">Adicionar Novo Serviço</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            {/* Nome do Serviço */}
            <div className="grid gap-2">
              <Label htmlFor="serviceName" className="text-sm font-medium">
                Nome do Serviço <span className="text-red-500">*</span>
              </Label>
              <Input
                id="serviceName"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Ex: Corte Degradê"
                disabled={submitting}
                className="h-11 text-base"
              />
            </div>

            {/* Preço */}
            <div className="grid gap-2">
              <Label htmlFor="servicePrice" className="text-sm font-medium">
                Preço (R$) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="servicePrice"
                  type="number"
                  step="0.01"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  placeholder="25.00"
                  disabled={submitting}
                  className="h-11 text-base pl-9"
                />
              </div>
            </div>

            {/* Duração */}
            <div className="grid gap-2">
              <Label htmlFor="serviceDuration" className="text-sm font-medium">
                Duração (minutos) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="serviceDuration"
                  type="number"
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(e.target.value)}
                  placeholder="30"
                  disabled={submitting}
                  className="h-11 text-base pl-9"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="grid gap-2">
              <Label htmlFor="serviceDescription" className="text-sm font-medium">
                Descrição (opcional)
              </Label>
              <Input
                id="serviceDescription"
                value={newServiceDescription}
                onChange={(e) => setNewServiceDescription(e.target.value)}
                placeholder="Descrição do serviço"
                disabled={submitting}
                className="h-11 text-base"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAddService} 
            className="w-full mt-4 h-11 text-base font-medium active:scale-95 transition-transform touch-manipulation"
            disabled={submitting}
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Serviço
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Services - Lista Otimizada */}
      <Card className="shadow-sm">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg md:text-xl">
              Serviços Cadastrados
            </CardTitle>
            {services.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {services.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {services.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <Scissors className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                Nenhum serviço cadastrado
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                Adicione seu primeiro serviço usando o formulário acima
              </p>
            </div>
          ) : (
            <div className="grid gap-2 sm:gap-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border rounded-lg transition-all",
                    service.active 
                      ? "bg-card hover:bg-accent/50 border-border" 
                      : "bg-muted/30 border-muted-foreground/20 opacity-75"
                  )}
                >
                  {/* Conteúdo Principal */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center flex-shrink-0",
                      service.active ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Scissors className={cn(
                        "h-5 w-5 sm:h-6 sm:w-6",
                        service.active ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm sm:text-base truncate">
                          {service.name}
                        </h4>
                        <Badge 
                          variant={service.active ? "default" : "secondary"} 
                          className="text-[10px] sm:text-xs flex-shrink-0"
                        >
                          {service.active ? '✓ Ativo' : '○ Inativo'}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium">R$ {service.price.toFixed(2)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>{service.duration_minutes} min</span>
                        </span>
                      </div>
                      
                      {service.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pl-[52px] sm:pl-0">
                    <div className="flex items-center gap-2">
                      <Label 
                        htmlFor={`switch-${service.id}`} 
                        className="text-xs sm:text-sm text-muted-foreground cursor-pointer"
                      >
                        {service.active ? 'Ativo' : 'Inativo'}
                      </Label>
                      <Switch
                        id={`switch-${service.id}`}
                        checked={service.active}
                        onCheckedChange={() => handleToggleService(service.id, service.active)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteService(service.id)}
                      className="h-10 w-10 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive active:scale-90 transition-all touch-manipulation"
                      aria-label="Excluir serviço"
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

      {/* Info Card - Dica para o usuário */}
      {services.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Dica:</span> Desative serviços temporariamente em vez de excluí-los. 
                Assim você preserva o histórico de agendamentos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}