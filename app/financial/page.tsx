'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SearchBar } from '@/components/ui/search-bar';
import { Sidebar } from '@/components/layout/Sidebar';
import { UserMenu } from '@/components/layout/UserMenu';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowUpDown,
  Filter,
  Download,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

export default function FinancialPage() {
  const { appointments, clients, metrics } = useAppStore();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [monthlyGoal, setMonthlyGoal] = useState(5000);
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('5000');

  // Calculate financial metrics
  const financialData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_date);
      const isInPeriod = aptDate >= startDate && aptDate <= now;
      const isCompleted = apt.status === 'completed';
      const matchesPayment = selectedPaymentMethod === 'all' || apt.payment_method === selectedPaymentMethod;
      
      return isInPeriod && isCompleted && matchesPayment;
    });

    const totalRevenue = filteredAppointments.reduce((sum, apt) => sum + apt.price, 0);
    const totalAppointments = filteredAppointments.length;
    const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    // Payment method breakdown
    const paymentMethods = filteredAppointments.reduce((acc, apt) => {
      const method = apt.payment_method || 'não informado';
      acc[method] = (acc[method] || 0) + apt.price;
      return acc;
    }, {} as Record<string, number>);

    // Daily revenue for chart
    const dailyRevenue = filteredAppointments.reduce((acc, apt) => {
      const date = apt.scheduled_date.split('T')[0];
      acc[date] = (acc[date] || 0) + apt.price;
      return acc;
    }, {} as Record<string, number>);

    // Top services
    const serviceRevenue = filteredAppointments.reduce((acc, apt) => {
      acc[apt.service_type] = (acc[apt.service_type] || 0) + apt.price;
      return acc;
    }, {} as Record<string, number>);

    const topServices = Object.entries(serviceRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalRevenue,
      totalAppointments,
      averageTicket,
      paymentMethods,
      dailyRevenue,
      topServices,
      appointments: filteredAppointments
    };
  }, [appointments, selectedPeriod, selectedPaymentMethod]);
  
  const paymentMethodIcons = {
    dinheiro: <Banknote className="h-4 w-4" />,
    cartao: <CreditCard className="h-4 w-4" />,
    pix: <Smartphone className="h-4 w-4" />,
    transferencia: <ArrowUpDown className="h-4 w-4" />
  };

  const paymentMethodLabels = {
    dinheiro: 'Dinheiro',
    cartao: 'Cartão',
    pix: 'PIX',
    transferencia: 'Transferência'
  };

  // Filter appointments by search term
  const searchFilteredAppointments = useMemo(() => {
    if (!searchTerm) return financialData.appointments;
    
    return financialData.appointments.filter(apt => {
      const client = clients.find(c => c.id === apt.client_id);
      const clientName = client?.name.toLowerCase() || '';
      const serviceType = apt.service_type.toLowerCase();
      const paymentMethod = apt.payment_method?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      
      return clientName.includes(search) || 
               serviceType.includes(search) || 
               paymentMethod.includes(search);
    });
  }, [financialData.appointments, searchTerm, clients]);

  const handleSaveGoal = () => {
    const newGoal = parseFloat(tempGoal.replace(',', '.'));
    if (!isNaN(newGoal) && newGoal > 0) {
      setMonthlyGoal(newGoal);
      setEditingGoal(false);
    }
  };

  const handleCancelEdit = () => {
    setTempGoal(monthlyGoal.toString());
    setEditingGoal(false);
  };

  const exportData = () => {
    // Simple CSV export functionality
    const csvContent = [
      ['Data', 'Cliente', 'Serviço', 'Valor', 'Pagamento'].join(','),
      ...searchFilteredAppointments.map(apt => {
        const client = clients.find(c => c.id === apt.client_id);
        return [
          formatDate(apt.scheduled_date),
          client?.name || 'N/A',
          apt.service_type,
          apt.price,
          paymentMethodLabels[apt.payment_method as keyof typeof paymentMethodLabels] || 'N/A'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro-${selectedPeriod}-${formatDate(new Date())}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
                  <p className="text-muted-foreground">
                    Acompanhe receitas, pagamentos e performance financeira
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <SearchBar className="w-80 hidden md:block" />
                  <Button onClick={exportData} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <UserMenu />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label htmlFor="period">Período:</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger id="period" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">7 dias</SelectItem>
                      <SelectItem value="month">Este mês</SelectItem>
                      <SelectItem value="year">Este ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="payment">Pagamento:</Label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger id="payment" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar transações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>

              {/* Metrics Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Receita Total"
                  value={financialData.totalRevenue}
                  type="currency"
                  icon={<DollarSign className="h-4 w-4" />}
                  className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                />
                
                <MetricCard
                  title="Atendimentos"
                  value={financialData.totalAppointments}
                  icon={<Calendar className="h-4 w-4" />}
                />
                
                <MetricCard
                  title="Ticket Médio"
                  value={financialData.averageTicket}
                  type="currency"
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                
                <MetricCard
                  title="Receita Hoje"
                  value={metrics.todayRevenue}
                  type="currency"
                  icon={<DollarSign className="h-4 w-4" />}
                  className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                />
              </div>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="transactions">Transações</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Payment Methods */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Métodos de Pagamento</CardTitle>
                        <CardDescription>
                          Distribuição por forma de pagamento no período
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(financialData.paymentMethods).map(([method, amount]) => {
                            const percentage = (amount / financialData.totalRevenue) * 100;
                            return (
                              <div key={method} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {paymentMethodIcons[method as keyof typeof paymentMethodIcons]}
                                  <span className="text-sm font-medium">
                                    {paymentMethodLabels[method as keyof typeof paymentMethodLabels] || method}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(amount)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {percentage.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top Services */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Serviços Mais Rentáveis</CardTitle>
                        <CardDescription>
                          Top 5 serviços por receita no período
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {financialData.topServices.map(([service, revenue], index) => (
                            <div key={service} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  #{index + 1}
                                </Badge>
                                <span className="text-sm font-medium">{service}</span>
                              </div>
                              <div className="font-medium">{formatCurrency(revenue)}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Histórico de Transações</CardTitle>
                      <CardDescription>
                        {searchFilteredAppointments.length} transações encontradas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Serviço</TableHead>
                              <TableHead>Pagamento</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {searchFilteredAppointments.slice(0, 50).map((appointment) => {
                              const client = clients.find(c => c.id === appointment.client_id);
                              return (
                                <TableRow key={appointment.id}>
                                  <TableCell className="font-mono text-sm">
                                    {formatDateTime(appointment.scheduled_date)}
                                  </TableCell>
                                  <TableCell>
                                    {client ? (
                                      <div>
                                        <div className="font-medium">{client.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {client.phone}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">Cliente não encontrado</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{appointment.service_type}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {appointment.payment_method && paymentMethodIcons[appointment.payment_method as keyof typeof paymentMethodIcons]}
                                      <span className="text-sm">
                                        {appointment.payment_method 
                                          ? paymentMethodLabels[appointment.payment_method as keyof typeof paymentMethodLabels]
                                          : 'Não informado'
                                        }
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(appointment.price)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {searchFilteredAppointments.length > 50 && (
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                          Mostrando 50 de {searchFilteredAppointments.length} transações
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Resumo do Período</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-secondary/50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(financialData.totalRevenue)}
                            </div>
                            <div className="text-sm text-muted-foreground">Receita Total</div>
                          </div>
                          <div className="text-center p-4 bg-secondary/50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {financialData.totalAppointments}
                            </div>
                            <div className="text-sm text-muted-foreground">Atendimentos</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                          <CardTitle>Comparativo</CardTitle>
                        </div>
                        <Dialog open={editingGoal} onOpenChange={setEditingGoal}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit3 className="h-4 w-4 mr-2" />
                              Editar Meta
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Editar Meta Mensal</DialogTitle>
                              <DialogDescription>
                                Defina sua meta de receita mensal para acompanhar o progresso.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="goal" className="text-right">
                                  Meta (R$)
                                </Label>
                                <Input
                                  id="goal"
                                  value={tempGoal}
                                  onChange={(e) => setTempGoal(e.target.value)}
                                  placeholder="5000"
                                  className="col-span-3"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={handleCancelEdit}>
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                              </Button>
                              <Button onClick={handleSaveGoal}>
                                <Save className="h-4 w-4 mr-2" />
                                Salvar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Receita vs Meta Mensal</span>
                            <div className="flex items-center gap-2">
                              {financialData.totalRevenue >= monthlyGoal ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-orange-600" />
                              )}
                              <span className="font-medium">
                                {((financialData.totalRevenue / monthlyGoal) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className={cn(
                                "h-2 rounded-full transition-all duration-500",
                                financialData.totalRevenue >= monthlyGoal 
                                  ? "bg-green-600" 
                                  : "bg-orange-600"
                              )}
                              style={{ width: `${Math.min((financialData.totalRevenue / monthlyGoal) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Meta: {formatCurrency(monthlyGoal)}</span>
                            <span>
                              Faltam: {formatCurrency(Math.max(0, monthlyGoal - financialData.totalRevenue))}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}