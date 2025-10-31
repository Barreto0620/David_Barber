// @ts-nocheck
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { AddMonthlyClientModal } from '@/components/monthly-clients/forms';
import { MonthlyAppointmentsView } from '@/components/monthly-clients/monthly-appointments-view';
import { MonthlySchedulePicker } from '@/components/monthly-clients/schedule-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Plus, UserCheck, Calendar, AlertTriangle, CheckCircle2, XCircle, Clock, TrendingUp, Users, CreditCard, Eye, Trash2, CalendarClock, Pause, Play, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PLAN_INFO = {
  basic: { name: 'Básico', color: 'bg-blue-500', visits: '1x/semana', icon: '🔷' },
  premium: { name: 'Premium', color: 'bg-purple-500', visits: '2x/semana', icon: '💎' },
  vip: { name: 'VIP', color: 'bg-amber-500', visits: 'Até 4x/semana', icon: '👑' }
};

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function MonthlyClientsPage() {
  const { 
    monthlyClients, 
    monthlyClientsLoading,
    appointments,
    fetchMonthlyClients,
    fetchAppointments,
    updateMonthlyClient,
    updateAppointment,
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
      // 1. Remove todos os agendamentos antigos
      const oldAppointments = appointments.filter(apt => 
        apt.client_id === clientToEdit.client_id && 
        apt.status !== 'cancelled' && 
        apt.notes?.includes('Cliente Mensal')
      );

      for (const apt of oldAppointments) {
        await deleteAppointment(apt.id);
      }

      // 2. Cria novos agendamentos
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

  const getStatusColor = (mc: any) => {
    if (mc.payment_status === 'overdue') return 'bg-red-500';
    const today = new Date();
    const nextPayment = new Date(mc.next_payment_date);
    const daysUntilPayment = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if ((daysUntilPayment <= 7 && daysUntilPayment >= 0) || mc.payment_status === 'pending') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'pending': return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'overdue': return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Atrasado</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="outline" className="border-green-500 text-green-500">Ativo</Badge>;
      case 'suspended': return <Badge variant="outline" className="border-orange-500 text-orange-500">Suspenso</Badge>;
      case 'inactive': return <Badge variant="outline" className="border-gray-500 text-gray-500">Inativo</Badge>;
      default: return null;
    }
  };

  if (monthlyClientsLoading && monthlyClients.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando clientes mensais...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes Mensais</h1>
          <p className="text-muted-foreground">Gerencie planos mensais e agendamentos recorrentes</p>
        </div>
        <Button onClick={() => setAddClientOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Cliente Mensal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          {filteredClients.map((mc) => {
            const clientAppointments = appointments
              .filter(apt => apt.client_id === mc.client_id && apt.status !== 'cancelled' && apt.notes?.includes('Cliente Mensal'))
              .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
            
            return (
              <Card key={mc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{mc.client.name}</CardTitle>
                      <CardDescription className="text-sm">{mc.client.phone}</CardDescription>
                    </div>
                    <div className={cn("w-3 h-3 rounded-full", getStatusColor(mc))} />
                  </div>
                  <div className="flex gap-2 pt-2 flex-wrap">
                    {getStatusBadge(mc.status)}
                    {getPaymentStatusBadge(mc.payment_status)}
                    <Badge className={PLAN_INFO[mc.plan_type as keyof typeof PLAN_INFO].color}>
                      {PLAN_INFO[mc.plan_type as keyof typeof PLAN_INFO].icon} {PLAN_INFO[mc.plan_type as keyof typeof PLAN_INFO].name}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="font-bold text-green-600">R$ {Number(mc.monthly_price).toFixed(2)}/mês</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Próximo Venc.:</span>
                      <span className="font-medium">{new Date(mc.next_payment_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarClock className="w-4 h-4" />
                      Agendamentos ({clientAppointments.length}):
                    </div>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                      {clientAppointments.length > 0 ? (
                        clientAppointments.map((apt: any, idx: number) => {
                          const aptDate = new Date(apt.scheduled_date);
                          const dayOfWeek = DAYS_OF_WEEK[aptDate.getDay()];
                          const dateStr = aptDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                          const time = aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div key={idx} className="grid grid-cols-3 gap-2 text-xs bg-muted/50 rounded p-2">
                              <span className="font-medium">{dayOfWeek} {dateStr}</span>
                              <span className="text-center font-semibold">{time}</span>
                              <span className="text-muted-foreground text-right truncate">{apt.service_type}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="grid grid-cols-3 gap-2 text-xs bg-muted/50 rounded p-2">
                          <span className="font-medium">-</span>
                          <span className="text-center text-muted-foreground italic">Nenhum agendamento</span>
                          <span className="text-muted-foreground text-right">-</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Total de visitas:</span>
                    <span className="font-bold">{mc.total_visits}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewDetails(mc)}>
                      <Eye className="w-4 h-4 mr-1" />Detalhes
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditSchedules(mc)} title="Editar horários">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {mc.payment_status !== 'paid' && mc.status === 'active' && (
                      <Button variant="default" size="sm" onClick={() => handleMarkAsPaid(mc.id)} title="Marcar como pago">
                        <CreditCard className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant={mc.status === 'suspended' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSuspendPlan(mc.id)}
                      className={mc.status === 'suspended' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                      title={mc.status === 'suspended' ? 'Reativar plano' : 'Suspender plano'}
                    >
                      {mc.status === 'suspended' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleCancelPlan(mc.id)} title="Cancelar e excluir plano">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedClient.client.name}</DialogTitle>
                <DialogDescription>Detalhes completos do plano mensal</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="flex gap-2 flex-wrap">
                    {getStatusBadge(selectedClient.status)}
                    {getPaymentStatusBadge(selectedClient.payment_status)}
                    <Badge className={PLAN_INFO[selectedClient.plan_type as keyof typeof PLAN_INFO].color}>
                      {PLAN_INFO[selectedClient.plan_type as keyof typeof PLAN_INFO].name}
                    </Badge>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações de Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone:</span>
                        <span className="font-medium">{selectedClient.client.phone}</span>
                      </div>
                      {selectedClient.client.email && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{selectedClient.client.email}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detalhes do Plano</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Mensal:</span>
                        <span className="font-bold text-green-600">R$ {Number(selectedClient.monthly_price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data de Início:</span>
                        <span className="font-medium">{new Date(selectedClient.start_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {selectedClient.last_payment_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Último Pagamento:</span>
                          <span className="font-medium">{new Date(selectedClient.last_payment_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Próximo Vencimento:</span>
                        <span className="font-medium">{new Date(selectedClient.next_payment_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total de Visitas:</span>
                        <span className="font-bold">{selectedClient.total_visits}</span>
                      </div>
                    </CardContent>
                  </Card>
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
                </TabsContent>
                <TabsContent value="appointments" className="space-y-4 mt-4">
                  <MonthlyAppointmentsView clientId={selectedClient.client_id} schedules={selectedClient.schedules} />
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AddMonthlyClientModal open={addClientOpen} onClose={() => setAddClientOpen(false)} onSuccess={() => { setAddClientOpen(false); fetchMonthlyClients(); }} />
    </div>
  );
}