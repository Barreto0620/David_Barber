// @ts-nocheck
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { AddMonthlyClientModal } from '@/components/monthly-clients/forms';
import { MonthlySchedulePicker } from '@/components/monthly-clients/schedule-picker';
import { MonthlyClientCard } from '@/components/monthly-clients/monthly-client-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Plus, UserCheck, Users, TrendingUp, Clock, AlertTriangle, Play, Pause, Phone, Mail, Calendar, CreditCard, RefreshCw, Package, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PLAN_INFO = {
  basic: { name: 'Básico', color: 'from-blue-500 to-blue-600', visits: '1x/semana', icon: '🔷' },
  premium: { name: 'Premium', color: 'from-purple-500 to-violet-600', visits: '2x/semana', icon: '💎' },
  vip: { name: 'VIP', color: 'from-amber-500 to-orange-600', visits: 'Até 4x/semana', icon: '👑' }
};

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const STATUS_CONFIG = {
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Clock },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
  no_show: { label: 'Faltou', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertTriangle }
};

export default function MonthlyClientsPage() {
  const { 
    monthlyClients, 
    monthlyClientsLoading,
    appointments,
    fetchMonthlyClients,
    fetchAppointments,
    deleteAppointment,
    deleteMonthlyClient,
    suspendMonthlyClient,
    reactivateMonthlyClient,
    markMonthlyPaymentAsPaid,
    setupMonthlyClientsRealtime
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [clientToCancel, setClientToCancel] = useState<string | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [clientToSuspend, setClientToSuspend] = useState<string | null>(null);
  const [editSchedulesOpen, setEditSchedulesOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any>(null);
  const [editingSchedules, setEditingSchedules] = useState<Array<{date: string; time: string; serviceType: string}>>([]);

  useEffect(() => {
    fetchMonthlyClients();
    const unsubscribe = setupMonthlyClientsRealtime();
    return () => unsubscribe?.();
  }, []);

  const stats = useMemo(() => {
    const active = monthlyClients.filter(c => c.status === 'active').length;
    const totalRevenue = monthlyClients.filter(c => c.status === 'active').reduce((sum, c) => sum + Number(c.monthly_price), 0);
    const pendingPayments = monthlyClients.filter(c => c.payment_status === 'pending').length;
    const overduePayments = monthlyClients.filter(c => c.payment_status === 'overdue').length;
    return { active, totalRevenue, pendingPayments, overduePayments };
  }, [monthlyClients]);

  const filteredClients = useMemo(() => {
    return monthlyClients.filter(mc => {
      const matchesSearch = mc.client.name.toLowerCase().includes(searchTerm.toLowerCase()) || mc.client.phone.includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || mc.status === filterStatus;
      const matchesPayment = filterPayment === 'all' || mc.payment_status === filterPayment;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [monthlyClients, searchTerm, filterStatus, filterPayment]);

  const getClientAppointments = (clientId: string) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const filtered = appointments.filter(apt => {
      if (apt.client_id !== clientId) return false;
      
      const aptDate = new Date(apt.scheduled_date);
      const isInCurrentMonth = aptDate >= startOfMonth && aptDate <= endOfMonth;
      
      const isMonthlyAppointment = apt.notes?.includes('Cliente Mensal') || apt.notes?.includes('Recorrente');
      
      return isInCurrentMonth && (isMonthlyAppointment || apt.status !== 'cancelled');
    });

    return filtered.sort((a, b) => 
      new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    );
  };

  const handleViewDetails = (client: any) => {
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

  const confirmSuspendPlan = async () => {
    if (!clientToSuspend) return;
    const client = monthlyClients.find(c => c.id === clientToSuspend);
    const success = client?.status === 'suspended' ? await reactivateMonthlyClient(clientToSuspend) : await suspendMonthlyClient(clientToSuspend);
    if (success) {
      setSuspendDialogOpen(false);
      setClientToSuspend(null);
    }
  };

  const confirmCancelPlan = async () => {
    if (!clientToCancel) return;
    const success = await deleteMonthlyClient(clientToCancel);
    if (success) {
      setCancelDialogOpen(false);
      setClientToCancel(null);
    }
  };

  const handleMarkAsPaid = async (clientId: string) => {
    await markMonthlyPaymentAsPaid(clientId);
  };

  const handleEditSchedules = (client: any) => {
    const clientAppointments = appointments
      .filter(apt => apt.client_id === client.client_id && apt.status !== 'cancelled' && apt.notes?.includes('Cliente Mensal'))
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

    const schedules = clientAppointments.map((apt: any) => {
      const aptDate = new Date(apt.scheduled_date);
      return {
        date: aptDate.toISOString().split('T')[0],
        time: aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        serviceType: apt.service_type
      };
    });

    setClientToEdit(client);
    setEditingSchedules(schedules);
    setEditSchedulesOpen(true);
  };

  const handleSaveSchedules = async () => {
    if (!clientToEdit) return;
    
    try {
      const oldAppointments = appointments.filter(apt => 
        apt.client_id === clientToEdit.client_id && 
        apt.status !== 'cancelled' && 
        apt.notes?.includes('Cliente Mensal')
      );

      for (const apt of oldAppointments) {
        await deleteAppointment(apt.id);
      }

      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) {
        toast.error('Erro de autenticação');
        return;
      }

      const pricePerVisit = editingSchedules.length > 0 
        ? clientToEdit.monthly_price / editingSchedules.length 
        : clientToEdit.monthly_price;

      const appointmentsToInsert = editingSchedules.map(schedule => {
        const [hours, minutes] = schedule.time.split(':');
        const scheduledDate = new Date(schedule.date + 'T00:00:00');
        scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        return {
          client_id: clientToEdit.client_id,
          scheduled_date: scheduledDate.toISOString(),
          service_type: schedule.serviceType,
          status: 'scheduled',
          price: pricePerVisit,
          payment_method: null,
          created_via: 'manual',
          notes: '🔄 Agendamento Recorrente - Cliente Mensal',
          professional_id: userAuth.user.id
        };
      });

      const { error } = await supabase.from('appointments').insert(appointmentsToInsert);
      
      if (error) throw error;

      toast.success('Agendamentos atualizados com sucesso!');
      await fetchAppointments();
      setEditSchedulesOpen(false);
      setClientToEdit(null);
      setEditingSchedules([]);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar agendamentos');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="outline" className="border-green-500 text-green-500 bg-green-50 dark:bg-green-950/20 font-semibold">✓ Ativo</Badge>;
      case 'suspended': return <Badge variant="outline" className="border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-950/20 font-semibold">⏸ Suspenso</Badge>;
      case 'inactive': return <Badge variant="outline" className="border-gray-500 text-gray-500 bg-gray-50 dark:bg-gray-950/20 font-semibold">○ Inativo</Badge>;
      default: return null;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-md">✓ Pago</Badge>;
      case 'pending': return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 shadow-md">⏱ Pendente</Badge>;
      case 'overdue': return <Badge className="bg-gradient-to-r from-red-500 to-rose-600 shadow-md animate-pulse">⚠ Atrasado</Badge>;
      default: return null;
    }
  };

  if (monthlyClientsLoading && monthlyClients.length === 0) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-muted-foreground">Carregando clientes mensais...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clientes Mensais</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie planos mensais e agendamentos recorrentes</p>
        </div>
        <Button onClick={() => setAddClientOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Adicionar Cliente Mensal</span>
          <span className="sm:hidden">Adicionar</span>
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{monthlyClients.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">De clientes ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Atrasados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.overduePayments}</div>
            <p className="text-xs text-muted-foreground">Requer atenção</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou telefone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPayment} onValueChange={(v: any) => setFilterPayment(v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Pagamento" /></SelectTrigger>
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

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhum cliente mensal encontrado</p>
              <p className="text-muted-foreground">{searchTerm ? 'Tente ajustar sua busca' : 'Comece adicionando clientes mensais'}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((mc) => (
            <MonthlyClientCard
              key={mc.id}
              client={mc}
              appointments={appointments}
              onViewDetails={() => handleViewDetails(mc)}
              onEditSchedules={() => handleEditSchedules(mc)}
              onMarkAsPaid={() => handleMarkAsPaid(mc.id)}
              onSuspend={() => handleSuspendPlan(mc.id)}
              onCancel={() => handleCancelPlan(mc.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={editSchedulesOpen} onOpenChange={setEditSchedulesOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {clientToEdit && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">Editar Agendamentos</DialogTitle>
                <DialogDescription>
                  {clientToEdit.client.name} - Gerencie os agendamentos do mês
                </DialogDescription>
              </DialogHeader>

              <MonthlySchedulePicker
                maxSchedules={clientToEdit.plan_type === 'premium' ? 2 : 4}
                selectedSchedules={editingSchedules}
                onSchedulesChange={setEditingSchedules}
                currentClientId={clientToEdit.client_id}
              />

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditSchedulesOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveSchedules}>Salvar Alterações</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <AlertDialogTitle className="text-center text-xl">Cancelar Plano Mensal?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">Esta ação irá cancelar o plano mensal do cliente e remover todos os agendamentos recorrentes automaticamente. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter Plano</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelPlan} className="bg-red-600 hover:bg-red-700">Sim, Cancelar Plano</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/20">
              {monthlyClients.find(c => c.id === clientToSuspend)?.status === 'suspended' ? (
                <Play className="w-6 h-6 text-green-600 dark:text-green-500" />
              ) : (
                <Pause className="w-6 h-6 text-orange-600 dark:text-orange-500" />
              )}
            </div>
            <AlertDialogTitle className="text-center text-xl">
              {monthlyClients.find(c => c.id === clientToSuspend)?.status === 'suspended' ? 'Reativar Plano Mensal?' : 'Suspender Plano Mensal?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {monthlyClients.find(c => c.id === clientToSuspend)?.status === 'suspended' 
                ? 'Esta ação irá reativar o plano mensal e os agendamentos recorrentes do cliente.'
                : 'Esta ação irá suspender temporariamente o plano mensal e os agendamentos recorrentes. Você pode reativá-lo a qualquer momento.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSuspendPlan}
              className={monthlyClients.find(c => c.id === clientToSuspend)?.status === 'suspended' ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
            >
              {monthlyClients.find(c => c.id === clientToSuspend)?.status === 'suspended' ? 'Sim, Reativar Plano' : 'Sim, Suspender Plano'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader className="border-b pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-2">
                      {selectedClient.client.name}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      Detalhes completos do plano mensal
                    </DialogDescription>
                  </div>
                  <div className={cn(
                    "px-6 py-3 rounded-full text-base font-bold text-white shadow-xl flex items-center gap-2",
                    `bg-gradient-to-r ${PLAN_INFO[selectedClient.plan_type as keyof typeof PLAN_INFO].color}`
                  )}>
                    <RefreshCw className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="text-2xl">{PLAN_INFO[selectedClient.plan_type as keyof typeof PLAN_INFO].icon}</span>
                    {PLAN_INFO[selectedClient.plan_type as keyof typeof PLAN_INFO].name}
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap mt-4">
                  {getStatusBadge(selectedClient.status)}
                  {getPaymentStatusBadge(selectedClient.payment_status)}
                </div>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="info" className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white">
                    📋 Informações
                  </TabsTrigger>
                  <TabsTrigger value="appointments" className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white">
                    📅 Agendamentos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6 mt-8">
                  <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-background">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        Informações de Contato
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-background rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-purple-600" />
                          <span className="text-sm text-muted-foreground">Telefone</span>
                        </div>
                        <span className="font-bold text-lg">{selectedClient.client.phone}</span>
                      </div>
                      {selectedClient.client.email && (
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-background rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-purple-600" />
                            <span className="text-sm text-muted-foreground">Email</span>
                          </div>
                          <span className="font-bold text-lg">{selectedClient.client.email}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/20 dark:to-background">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        Detalhes Financeiros
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border-2 border-green-300 dark:border-green-700">
                        <span className="text-sm font-medium text-muted-foreground">Valor Mensal</span>
                        <span className="font-bold text-2xl text-green-600 dark:text-green-400">
                          R$ {Number(selectedClient.monthly_price).toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white dark:bg-background rounded-lg border">
                          <div className="text-xs text-muted-foreground mb-1">Início do Plano</div>
                          <div className="font-bold">
                            {new Date(selectedClient.start_date).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'long',
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                        <div className="p-3 bg-white dark:bg-background rounded-lg border">
                          <div className="text-xs text-muted-foreground mb-1">Próximo Vencimento</div>
                          <div className="font-bold text-purple-600 dark:text-purple-400">
                            {new Date(selectedClient.next_payment_date).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'long',
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                      {selectedClient.last_payment_date && (
                        <div className="p-3 bg-white dark:bg-background rounded-lg border">
                          <div className="text-xs text-muted-foreground mb-1">Último Pagamento</div>
                          <div className="font-bold text-green-600 dark:text-green-400">
                            {new Date(selectedClient.last_payment_date).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'long',
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-background">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        Estatísticas do Plano
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg border-2 border-blue-300 dark:border-blue-700 text-center">
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {selectedClient.total_visits}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Total de Visitas</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-lg border-2 border-purple-300 dark:border-purple-700 text-center">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {selectedClient.schedules?.length || 0}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Horários/Semana</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedClient.notes && (
                    <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-background">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-white" />
                          </div>
                          Observações
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm p-4 bg-white dark:bg-background rounded-lg border italic">
                          {selectedClient.notes}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="appointments" className="space-y-4 mt-6">
                  {(() => {
                    const clientAppointments = getClientAppointments(selectedClient.client_id);
                    const stats = {
                      total: clientAppointments.length,
                      completed: clientAppointments.filter(a => a.status === 'completed').length,
                      scheduled: clientAppointments.filter(a => a.status === 'scheduled').length,
                      cancelled: clientAppointments.filter(a => a.status === 'cancelled').length
                    };

                    if (clientAppointments.length === 0) {
                      return (
                        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                          <CardContent className="p-12">
                            <div className="text-center">
                              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                Nenhum agendamento encontrado
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">
                                Os agendamentos deste cliente aparecerão aqui
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }

                    return (
                      <>
                        <div className="grid grid-cols-4 gap-4">
                          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
                            <CardContent className="p-6 text-center">
                              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                              <div className="text-xs text-muted-foreground mt-1">Total</div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
                            <CardContent className="p-6 text-center">
                              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
                              <div className="text-xs text-muted-foreground mt-1">Concluídos</div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
                            <CardContent className="p-6 text-center">
                              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.scheduled}</div>
                              <div className="text-xs text-muted-foreground mt-1">Agendados</div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
                            <CardContent className="p-6 text-center">
                              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</div>
                              <div className="text-xs text-muted-foreground mt-1">Cancelados</div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card className="border-2 border-purple-200 dark:border-purple-800">
                          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b-2 border-purple-200 dark:border-purple-800">
                            <CardTitle className="text-xl flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-purple-600" />
                              Agendamentos do Mês
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              {clientAppointments.map((apt) => {
                                const aptDate = new Date(apt.scheduled_date);
                                const statusConfig = STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled;
                                const StatusIcon = statusConfig.icon;
                                
                                return (
                                  <div
                                    key={apt.id}
                                    className={cn(
                                      "p-5 rounded-xl border-2 transition-all hover:shadow-lg",
                                      apt.status === 'completed' && "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-300 dark:border-green-700",
                                      apt.status === 'scheduled' && "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-300 dark:border-blue-700",
                                      apt.status === 'cancelled' && "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-300 dark:border-red-700 opacity-60",
                                      apt.status === 'no_show' && "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-300 dark:border-orange-700"
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4 flex-1">
                                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-background border-2 border-current shadow-md">
                                          <Calendar className="h-6 w-6" />
                                        </div>
                                        
                                        <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                            <span className="text-lg font-bold">
                                              {DIAS_SEMANA[aptDate.getDay()]}, {aptDate.getDate()}/{aptDate.getMonth() + 1}
                                            </span>
                                            <Badge variant="outline" className="font-semibold border-2">
                                              <Clock className="h-3 w-3 mr-1" />
                                              {aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </Badge>
                                          </div>
                                          
                                          <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-semibold text-base">{apt.service_type}</span>
                                            {apt.notes?.includes('Recorrente') && (
                                              <Badge variant="secondary" className="text-xs">
                                                🔄 Recorrente
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-4">
                                        <div className="text-right">
                                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            R$ {Number(apt.price || 0).toFixed(2)}
                                          </div>
                                          {apt.payment_method && (
                                            <div className="text-xs text-muted-foreground">
                                              {apt.payment_method}
                                            </div>
                                          )}
                                        </div>
                                        
                                        <Badge className={cn("text-sm font-semibold border-2 px-3 py-1.5", statusConfig.color)}>
                                          <StatusIcon className="h-4 w-4 mr-1.5" />
                                          {statusConfig.label}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>

                       
                      </>
                    );
                  })()}
                </TabsContent>
              </Tabs>

              <DialogFooter className="border-t pt-4 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setViewDetailsOpen(false)}
                  className="border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950/30"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AddMonthlyClientModal 
        open={addClientOpen} 
        onClose={() => setAddClientOpen(false)} 
        onSuccess={() => { 
          setAddClientOpen(false); 
          fetchMonthlyClients(); 
        }} 
      />
    </div>
  );
}