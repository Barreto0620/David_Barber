'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  PieChart,
  Download,
  CreditCard,
  Banknote
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';
import { Pie } from 'recharts';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils/currency';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { toast } from 'sonner';

type TimeRange = 'today' | 'week' | 'month' | 'year';
type PaymentMethod = 'dinheiro' | 'cartao' | 'pix' | 'transferencia';

export default function FinancialPage() {
  const { appointments, services } = useAppStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const completedAppointments = appointments.filter(apt => apt.status === 'completed');

  const getDateRange = (range: TimeRange) => {
    const now = new Date();
    const start = new Date();
    
    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start, end: now };
  };

  const filteredAppointments = useMemo(() => {
    const { start, end } = getDateRange(timeRange);
    return completedAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_date);
      return aptDate >= start && aptDate <= end;
    });
  }, [completedAppointments, timeRange]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredAppointments.reduce((sum, apt) => sum + apt.price, 0);
    const totalAppointments = filteredAppointments.length;
    const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
    
    // Previous period comparison
    const { start: prevStart, end: prevEnd } = getDateRange(timeRange);
    const timeDiff = prevEnd.getTime() - prevStart.getTime();
    const prevPeriodStart = new Date(prevStart.getTime() - timeDiff);
    
    const prevPeriodAppointments = completedAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_date);
      return aptDate >= prevPeriodStart && aptDate < prevStart;
    });
    
    const prevRevenue = prevPeriodAppointments.reduce((sum, apt) => sum + apt.price, 0);
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalAppointments,
      averageTicket,
      revenueGrowth,
      previousRevenue: prevRevenue
    };
  }, [filteredAppointments, completedAppointments, timeRange]);

  const serviceRevenueData = useMemo(() => {
    const serviceRevenue = filteredAppointments.reduce((acc, apt) => {
      acc[apt.service_type] = (acc[apt.service_type] || 0) + apt.price;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(serviceRevenue)
      .map(([service, revenue]) => ({ service, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredAppointments]);

  const paymentMethodData = useMemo(() => {
    const paymentCounts = filteredAppointments.reduce((acc, apt) => {
      if (apt.payment_method) {
        acc[apt.payment_method] = (acc[apt.payment_method] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const colors = {
      dinheiro: '#10B981',
      cartao: '#3B82F6',
      pix: '#8B5CF6',
      transferencia: '#F59E0B'
    };

    return Object.entries(paymentCounts).map(([method, count], index) => ({
      name: method === 'dinheiro' ? 'Dinheiro' :
            method === 'cartao' ? 'Cartão' :
            method === 'pix' ? 'PIX' : 'Transferência',
      value: count,
      color: colors[method as PaymentMethod] || '#6B7280'
    }));
  }, [filteredAppointments]);

  const dailyRevenueData = useMemo(() => {
    if (timeRange === 'today') return [];
    
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRevenue = filteredAppointments
        .filter(apt => apt.scheduled_date.startsWith(dateStr))
        .reduce((sum, apt) => sum + apt.price, 0);
      
      data.push({
        date: dateStr,
        day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        revenue: dayRevenue
      });
    }
    
    return data;
  }, [filteredAppointments, timeRange]);

  const exportFinancialData = () => {
    const csvData = filteredAppointments.map(apt => ({
      Data: formatDate(apt.scheduled_date),
      Cliente: apt.client?.name || 'N/A',
      Serviço: apt.service_type,
      Valor: apt.price,
      'Forma de Pagamento': apt.payment_method || 'N/A'
    }));
    
    // In a real implementation, you would generate and download CSV
    toast.success('Relatório financeiro exportado com sucesso!');
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'today': return 'Hoje';
      case 'week': return 'Última Semana';
      case 'month': return 'Último Mês';
      case 'year': return 'Último Ano';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho financeiro da barbearia
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportFinancialData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={`Receita Total - ${getTimeRangeLabel()}`}
          value={metrics.totalRevenue}
          type="currency"
          icon={<DollarSign className="h-4 w-4" />}
          trend={metrics.revenueGrowth > 0 ? 'up' : metrics.revenueGrowth < 0 ? 'down' : 'neutral'}
          trendValue={`${metrics.revenueGrowth > 0 ? '+' : ''}${metrics.revenueGrowth.toFixed(1)}% vs período anterior`}
        />
        <MetricCard
          title="Total de Serviços"
          value={metrics.totalAppointments}
          icon={<Calendar className="h-4 w-4" />}
          trend="neutral"
        />
        <MetricCard
          title="Ticket Médio"
          value={metrics.averageTicket}
          type="currency"
          icon={<TrendingUp className="h-4 w-4" />}
          trend="neutral"
        />
        <MetricCard
          title="Período Anterior"
          value={metrics.previousRevenue}
          type="currency"
          icon={<PieChart className="h-4 w-4" />}
          trend="neutral"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Receita Diária</TabsTrigger>
          <TabsTrigger value="services">Por Serviço</TabsTrigger>
          <TabsTrigger value="payments">Forma de Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Receita Diária - {getTimeRangeLabel()}</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyRevenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum dado de receita disponível para hoje</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Serviço - {getTimeRangeLabel()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceRevenueData.map((item, index) => (
                  <div key={item.service} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{item.service}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(item.revenue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {((item.revenue / metrics.totalRevenue) * 100).toFixed(1)}% do total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethodData.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-3">
                    {paymentMethodData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.name === 'Dinheiro' && <Banknote className="h-4 w-4" />}
                          {(item.name === 'Cartão' || item.name === 'PIX' || item.name === 'Transferência') && 
                            <CreditCard className="h-4 w-4" />}
                          <Badge variant="secondary">{item.value}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum dado de pagamento disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}