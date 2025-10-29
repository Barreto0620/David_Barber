'use client';

import { useState, useMemo } from 'react';
import { AddMonthlyClientModal } from '@/components/monthly-clients/forms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  Search, 
  Plus, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  CreditCard,
  Eye,
  Trash2,
  CalendarClock,
  Pause,
  Play
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// TIPOS MOCKADOS
interface MonthlyClient {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  planType: 'basic' | 'premium' | 'vip';
  monthlyPrice: number;
  startDate: string;
  status: 'active' | 'inactive' | 'suspended';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastPaymentDate?: string;
  nextPaymentDate: string;
  weeklySchedules: {
    dayOfWeek: number;
    time: string;
    serviceType: string;
  }[];
  totalVisits: number;
  notes?: string;
}

// DADOS MOCKADOS
const mockMonthlyClients: MonthlyClient[] = [
  {
    id: '1',
    clientId: 'c1',
    clientName: 'João Silva',
    clientPhone: '(11) 98765-4321',
    clientEmail: 'joao.silva@email.com',
    planType: 'premium',
    monthlyPrice: 150.00,
    startDate: '2024-01-15',
    status: 'active',
    paymentStatus: 'paid',
    lastPaymentDate: '2024-10-01',
    nextPaymentDate: '2024-11-01',
    weeklySchedules: [
      { dayOfWeek: 2, time: '14:00', serviceType: 'Corte + Barba' },
      { dayOfWeek: 5, time: '10:00', serviceType: 'Corte Simples' }
    ],
    totalVisits: 42,
    notes: 'Cliente VIP, sempre pontual'
  },
  {
    id: '2',
    clientId: 'c2',
    clientName: 'Pedro Santos',
    clientPhone: '(11) 91234-5678',
    planType: 'basic',
    monthlyPrice: 80.00,
    startDate: '2024-03-20',
    status: 'active',
    paymentStatus: 'pending',
    nextPaymentDate: '2024-11-01',
    weeklySchedules: [
      { dayOfWeek: 3, time: '16:00', serviceType: 'Corte Simples' }
    ],
    totalVisits: 28
  },
  {
    id: '3',
    clientId: 'c3',
    clientName: 'Carlos Oliveira',
    clientPhone: '(11) 99876-5432',
    clientEmail: 'carlos.oliveira@email.com',
    planType: 'vip',
    monthlyPrice: 250.00,
    startDate: '2024-02-10',
    status: 'active',
    paymentStatus: 'overdue',
    lastPaymentDate: '2024-09-01',
    nextPaymentDate: '2024-10-01',
    weeklySchedules: [
      { dayOfWeek: 1, time: '09:00', serviceType: 'Corte Premium + Barba' },
      { dayOfWeek: 4, time: '18:00', serviceType: 'Barba' }
    ],
    totalVisits: 35,
    notes: 'Pagamento em atraso - entrar em contato'
  },
  {
    id: '4',
    clientId: 'c4',
    clientName: 'Ricardo Almeida',
    clientPhone: '(11) 97654-3210',
    planType: 'basic',
    monthlyPrice: 80.00,
    startDate: '2024-05-01',
    status: 'suspended',
    paymentStatus: 'overdue',
    lastPaymentDate: '2024-08-01',
    nextPaymentDate: '2024-09-01',
    weeklySchedules: [
      { dayOfWeek: 2, time: '11:00', serviceType: 'Corte Simples' }
    ],
    totalVisits: 18,
    notes: 'Suspenso por inadimplência'
  }
];

const PLAN_INFO = {
  basic: { name: 'Básico', color: 'bg-blue-500', visits: '1x/semana' },
  premium: { name: 'Premium', color: 'bg-purple-500', visits: '2x/semana' },
  vip: { name: 'VIP', color: 'bg-amber-500', visits: '2x/semana + extras' }
};

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function MonthlyClientsPage() {
  const [clients, setClients] = useState<MonthlyClient[]>(mockMonthlyClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedClient, setSelectedClient] = useState<MonthlyClient | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [clientToCancel, setClientToCancel] = useState<string | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [clientToSuspend, setClientToSuspend] = useState<string | null>(null);

  // Estatísticas
  const stats = useMemo(() => {
    const active = clients.filter(c => c.status === 'active').length;
    const totalRevenue = clients
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + c.monthlyPrice, 0);
    const pendingPayments = clients.filter(c => c.paymentStatus === 'pending').length;
    const overduePayments = clients.filter(c => c.paymentStatus === 'overdue').length;

    return { active, totalRevenue, pendingPayments, overduePayments };
  }, [clients]);

  // Filtros
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = 
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.clientPhone.includes(searchTerm);
      
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      const matchesPayment = filterPayment === 'all' || client.paymentStatus === filterPayment;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [clients, searchTerm, filterStatus, filterPayment]);

  const handleViewDetails = (client: MonthlyClient) => {
    setSelectedClient(client);
    setViewDetailsOpen(true);
  };

  const handleCancelPlan = (clientId: string) => {
    setClientToCancel(clientId);
    setCancelDialogOpen(true);
  };

  const handleSuspendPlan = (clientId: string) => {
    setClientToSuspend(clientId);
    setSuspendDialogOpen(true);
  };

  const confirmSuspendPlan = () => {
    if (clientToSuspend) {
      const client = clients.find(c => c.id === clientToSuspend);
      const newStatus = client?.status === 'suspended' ? 'active' : 'suspended';
      
      setClients(prev => prev.map(c => 
        c.id === clientToSuspend 
          ? { ...c, status: newStatus as const }
          : c
      ));
      
      toast.success(newStatus === 'suspended' 
        ? 'Plano suspenso com sucesso!' 
        : 'Plano reativado com sucesso!'
      );
      setSuspendDialogOpen(false);
      setClientToSuspend(null);
    }
  };

  const confirmCancelPlan = () => {
    if (clientToCancel) {
      setClients(prev => prev.filter(c => c.id !== clientToCancel));
      toast.success('Plano mensal cancelado e removido com sucesso!');
      setCancelDialogOpen(false);
      setClientToCancel(null);
    }
  };

  const handleMarkAsPaid = (clientId: string) => {
    setClients(prev => prev.map(c => 
      c.id === clientId 
        ? { 
            ...c, 
            paymentStatus: 'paid' as const,
            lastPaymentDate: new Date().toISOString().split('T')[0],
            nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        : c
    ));
    toast.success('Pagamento registrado com sucesso!');
  };

  const getStatusColor = (client: MonthlyClient) => {
    // Se estiver atrasado, vermelho
    if (client.paymentStatus === 'overdue') {
      return 'bg-red-500';
    }
    
    // Verificar se está na semana do pagamento (próximos 7 dias) OU se está pendente
    const today = new Date();
    const nextPayment = new Date(client.nextPaymentDate);
    const daysUntilPayment = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if ((daysUntilPayment <= 7 && daysUntilPayment >= 0) || client.paymentStatus === 'pending') {
      return 'bg-yellow-500';
    }
    
    // Se está tudo ok, verde
    return 'bg-green-500';
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Atrasado</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-green-500 text-green-500">Ativo</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Suspenso</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Inativo</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes Mensais</h1>
          <p className="text-muted-foreground">
            Gerencie planos mensais e agendamentos recorrentes
          </p>
        </div>
        <Button onClick={() => setAddClientOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Cliente Mensal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {clients.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              De clientes ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Atrasados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.overduePayments}</div>
            <p className="text-xs text-muted-foreground">
              Requer atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPayment} onValueChange={(v: any) => setFilterPayment(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Pagamentos</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="overdue">Atrasados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhum cliente mensal encontrado</p>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar sua busca' : 'Comece adicionando clientes mensais'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{client.clientName}</CardTitle>
                    <CardDescription className="text-sm">
                      {client.clientPhone}
                    </CardDescription>
                  </div>
                  <div className={cn("w-3 h-3 rounded-full", getStatusColor(client))} />
                </div>
                
                <div className="flex gap-2 pt-2">
                  {getStatusBadge(client.status)}
                  {getPaymentStatusBadge(client.paymentStatus)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Plan Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Plano:</span>
                    <span className="font-medium">{PLAN_INFO[client.planType].name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-bold text-green-600">
                      R$ {client.monthlyPrice.toFixed(2)}/mês
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Próximo Venc.:</span>
                    <span className="font-medium">
                      {new Date(client.nextPaymentDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Schedules */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CalendarClock className="w-4 h-4" />
                    Horários Semanais:
                  </div>
                  <div className="space-y-1">
                    {client.weeklySchedules.map((schedule, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                        <span className="font-medium">{DAYS_OF_WEEK[schedule.dayOfWeek]}</span>
                        <span>{schedule.time}</span>
                        <span className="text-muted-foreground">{schedule.serviceType}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Total de visitas:</span>
                  <span className="font-bold">{client.totalVisits}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(client)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalhes
                  </Button>
                  
                  {client.paymentStatus !== 'paid' && client.status === 'active' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleMarkAsPaid(client.id)}
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Marcar Pago
                    </Button>
                  )}
                  
                  <Button
                    variant={client.status === 'suspended' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSuspendPlan(client.id)}
                    className={client.status === 'suspended' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                    title={client.status === 'suspended' ? 'Reativar plano' : 'Suspender plano'}
                  >
                    {client.status === 'suspended' ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelPlan(client.id)}
                    title="Cancelar e excluir plano"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedClient.clientName}</DialogTitle>
                <DialogDescription>
                  Detalhes completos do plano mensal
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status Badges */}
                <div className="flex gap-2">
                  {getStatusBadge(selectedClient.status)}
                  {getPaymentStatusBadge(selectedClient.paymentStatus)}
                  <Badge className={PLAN_INFO[selectedClient.planType].color}>
                    {PLAN_INFO[selectedClient.planType].name}
                  </Badge>
                </div>

                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações de Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="font-medium">{selectedClient.clientPhone}</span>
                    </div>
                    {selectedClient.clientEmail && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{selectedClient.clientEmail}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Plan Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detalhes do Plano</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Mensal:</span>
                      <span className="font-bold text-green-600">
                        R$ {selectedClient.monthlyPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data de Início:</span>
                      <span className="font-medium">
                        {new Date(selectedClient.startDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Último Pagamento:</span>
                      <span className="font-medium">
                        {selectedClient.lastPaymentDate 
                          ? new Date(selectedClient.lastPaymentDate).toLocaleDateString('pt-BR')
                          : 'Nenhum pagamento registrado'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Próximo Vencimento:</span>
                      <span className="font-medium">
                        {new Date(selectedClient.nextPaymentDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de Visitas:</span>
                      <span className="font-bold">{selectedClient.totalVisits}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Schedules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Agendamentos Semanais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedClient.weeklySchedules.map((schedule, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{DAYS_OF_WEEK[schedule.dayOfWeek]}-feira</div>
                              <div className="text-sm text-muted-foreground">{schedule.serviceType}</div>
                            </div>
                          </div>
                          <div className="text-lg font-bold">{schedule.time}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {selectedClient.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{selectedClient.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Plan Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Cancelar Plano Mensal?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Esta ação irá cancelar o plano mensal do cliente e remover todos os agendamentos
              recorrentes automaticamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter Plano</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelPlan}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, Cancelar Plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend/Resume Plan Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/20">
              {clients.find(c => c.id === clientToSuspend)?.status === 'suspended' ? (
                <Play className="w-6 h-6 text-green-600 dark:text-green-500" />
              ) : (
                <Pause className="w-6 h-6 text-orange-600 dark:text-orange-500" />
              )}
            </div>
            <AlertDialogTitle className="text-center text-xl">
              {clients.find(c => c.id === clientToSuspend)?.status === 'suspended' 
                ? 'Reativar Plano Mensal?' 
                : 'Suspender Plano Mensal?'
              }
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {clients.find(c => c.id === clientToSuspend)?.status === 'suspended' 
                ? 'Esta ação irá reativar o plano mensal e os agendamentos recorrentes do cliente.'
                : 'Esta ação irá suspender temporariamente o plano mensal e os agendamentos recorrentes. Você pode reativá-lo a qualquer momento.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSuspendPlan}
              className={clients.find(c => c.id === clientToSuspend)?.status === 'suspended'
                ? "bg-green-600 hover:bg-green-700"
                : "bg-orange-600 hover:bg-orange-700"
              }
            >
              {clients.find(c => c.id === clientToSuspend)?.status === 'suspended' 
                ? 'Sim, Reativar Plano' 
                : 'Sim, Suspender Plano'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Client Modal */}
      <AddMonthlyClientModal
        open={addClientOpen}
        onClose={() => setAddClientOpen(false)}
        onSuccess={(data) => {
          const newClient: MonthlyClient = {
            id: `mc_${Date.now()}`,
            clientId: data.clientId,
            clientName: data.clientName,
            clientPhone: data.clientPhone,
            clientEmail: data.clientEmail,
            planType: data.planType,
            monthlyPrice: data.monthlyPrice,
            startDate: data.startDate,
            status: 'active',
            paymentStatus: 'pending',
            nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            weeklySchedules: data.schedules.map((s: any) => ({
              dayOfWeek: s.dayOfWeek,
              time: s.time,
              serviceType: s.serviceType
            })),
            totalVisits: 0,
            notes: data.notes
          };
          
          setClients(prev => [...prev, newClient]);
        }}
      />
    </div>
  );
}