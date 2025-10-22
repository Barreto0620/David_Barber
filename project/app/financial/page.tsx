'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowUpDown,
  Download,
  Edit3,
  Save,
  X,
  Clock,
  CheckCircle2,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Filter,
  FileSpreadsheet,
  Printer,
  Wallet
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/currency';

const CHART_COLORS = {
  primary: '#059669',
  secondary: '#0891b2', 
  tertiary: '#7c3aed',
  quaternary: '#dc2626'
};

export default function FinancialPage() {
  const { appointments, clients } = useAppStore();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('monthlyGoal');
      return saved ? parseFloat(saved) : 5000;
    }
    return 5000;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('5000');
  const [chartType, setChartType] = useState('line');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [topViewMode, setTopViewMode] = useState('services'); // 'services' or 'clients'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('monthlyGoal', monthlyGoal.toString());
    }
  }, [monthlyGoal]);

  // Calculate financial metrics from real data
  const financialData = useMemo(() => {
    const now = new Date();
    let startDate;
    
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

    // Filter by search term (client name)
    let filteredAppointments = appointments;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredAppointments = appointments.filter(apt => {
        const client = clients.find(c => c.id === apt.client_id);
        return client?.name.toLowerCase().includes(searchLower);
      });
    }

    // Completed appointments (confirmed revenue)
    const completedAppointments = filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_date);
      const isInPeriod = aptDate >= startDate && aptDate <= now;
      const isCompleted = apt.status === 'completed';
      const matchesPayment = selectedPaymentMethod === 'all' || apt.payment_method === selectedPaymentMethod;
      
      return isInPeriod && isCompleted && matchesPayment;
    });

    // Future appointments (expected revenue)
    const futureAppointments = filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_date);
      const isInFuture = aptDate > now;
      const isScheduled = apt.status === 'scheduled';
      
      return isInFuture && isScheduled;
    });

    const confirmedRevenue = completedAppointments.reduce((sum, apt) => sum + apt.price, 0);
    const expectedRevenue = futureAppointments.reduce((sum, apt) => sum + apt.price, 0);
    const totalAppointments = completedAppointments.length;
    const averageTicket = totalAppointments > 0 ? confirmedRevenue / totalAppointments : 0;

    // Payment method breakdown
    const paymentMethods = completedAppointments.reduce((acc, apt) => {
      const method = apt.payment_method || 'não informado';
      acc[method] = (acc[method] || 0) + apt.price;
      return acc;
    }, {});

    // Daily revenue for chart
    const dailyData = {};
    completedAppointments.forEach(apt => {
      const date = apt.scheduled_date.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, revenue: 0, count: 0 };
      }
      dailyData[date].revenue += apt.price;
      dailyData[date].count += 1;
    });

    const chartData = Object.values(dailyData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Top services
    const serviceRevenue = completedAppointments.reduce((acc, apt) => {
      acc[apt.service_type] = (acc[apt.service_type] || 0) + apt.price;
      return acc;
    }, {});

    const topServices = Object.entries(serviceRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Top clients
    const clientRevenue = completedAppointments.reduce((acc, apt) => {
      const client = clients.find(c => c.id === apt.client_id);
      if (client) {
        if (!acc[client.id]) {
          acc[client.id] = { name: client.name, revenue: 0, count: 0 };
        }
        acc[client.id].revenue += apt.price;
        acc[client.id].count += 1;
      }
      return acc;
    }, {});

    const topClients = Object.entries(clientRevenue)
      .map(([id, data]) => [data.name, data.revenue, data.count])
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      confirmedRevenue,
      expectedRevenue,
      totalAppointments,
      averageTicket,
      paymentMethods,
      chartData,
      topServices,
      topClients,
      completedAppointments,
      futureAppointments
    };
  }, [appointments, clients, selectedPeriod, selectedPaymentMethod, searchTerm]);
  
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

  const paymentMethodColors = {
    dinheiro: CHART_COLORS.primary,
    cartao: CHART_COLORS.secondary,
    pix: CHART_COLORS.tertiary,
    transferencia: CHART_COLORS.quaternary
  };

  const searchFilteredAppointments = useMemo(() => {
    return [...financialData.completedAppointments, ...financialData.futureAppointments];
  }, [financialData.completedAppointments, financialData.futureAppointments]);

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

  const exportToExcel = () => {
    const periodLabel = selectedPeriod === 'today' ? 'Hoje' : 
                       selectedPeriod === 'week' ? 'Últimos 7 dias' : 
                       selectedPeriod === 'month' ? 'Este mês' : 'Este ano';
    
    const csvContent = [
      ['RELATÓRIO FINANCEIRO - DAVID BARBER'],
      ['Período:', periodLabel],
      ['Data de Geração:', new Date().toLocaleString('pt-BR')],
      [''],
      ['RESUMO'],
      ['Receita Confirmada:', formatCurrency(financialData.confirmedRevenue)],
      ['Receita a Receber:', formatCurrency(financialData.expectedRevenue)],
      ['Total de Atendimentos:', financialData.totalAppointments],
      ['Ticket Médio:', formatCurrency(financialData.averageTicket)],
      [''],
      ['TRANSAÇÕES DETALHADAS'],
      ['Data', 'Cliente', 'Telefone', 'Serviço', 'Valor', 'Pagamento', 'Status'],
      ...searchFilteredAppointments.map(apt => {
        const client = clients.find(c => c.id === apt.client_id);
        return [
          formatDateTime(apt.scheduled_date),
          client?.name || 'N/A',
          client?.phone || 'N/A',
          apt.service_type,
          `R$ ${apt.price.toFixed(2)}`,
          paymentMethodLabels[apt.payment_method] || 'N/A',
          apt.status === 'completed' ? 'Confirmado' : 'Agendado'
        ];
      })
    ].map(row => row.join(';')).join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro-${selectedPeriod}-${formatDate(new Date())}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setExportDialogOpen(false);
  };

  const exportToPDF = () => {
    const periodLabel = selectedPeriod === 'today' ? 'Hoje' : 
                       selectedPeriod === 'week' ? 'Últimos 7 dias' : 
                       selectedPeriod === 'month' ? 'Este mês' : 'Este ano';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório Financeiro - David Barber</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; margin-bottom: 30px; border-radius: 8px; }
          .header h1 { font-size: 32px; margin-bottom: 8px; }
          .header p { font-size: 16px; opacity: 0.9; }
          .info { margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; }
          .info p { margin: 5px 0; }
          .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
          .summary-card { padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #059669; }
          .summary-card.blue { background: #f0f9ff; border-left-color: #0891b2; }
          .summary-card h3 { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
          .summary-card p { font-size: 24px; font-weight: bold; color: #059669; }
          .summary-card.blue p { color: #0891b2; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #059669; color: white; padding: 12px; text-align: left; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
          @media print {
            body { padding: 0; }
            .header { border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DAVID BARBER</h1>
          <p>Relatório Financeiro</p>
        </div>
        
        <div class="info">
          <p><strong>Período:</strong> ${periodLabel}</p>
          <p><strong>Data de Geração:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <h3>Receita Confirmada</h3>
            <p>${formatCurrency(financialData.confirmedRevenue)}</p>
          </div>
          <div class="summary-card blue">
            <h3>Receita a Receber</h3>
            <p>${formatCurrency(financialData.expectedRevenue)}</p>
          </div>
          <div class="summary-card">
            <h3>Total de Atendimentos</h3>
            <p>${financialData.totalAppointments}</p>
          </div>
          <div class="summary-card blue">
            <h3>Ticket Médio</h3>
            <p>${formatCurrency(financialData.averageTicket)}</p>
          </div>
        </div>
        
        <h2 style="margin-bottom: 15px;">Transações Detalhadas</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Serviço</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${searchFilteredAppointments.slice(0, 50).map(apt => {
              const client = clients.find(c => c.id === apt.client_id);
              return `
                <tr>
                  <td>${formatDate(apt.scheduled_date)}</td>
                  <td>${client?.name || 'N/A'}</td>
                  <td>${apt.service_type}</td>
                  <td style="font-weight: bold; color: ${apt.status === 'completed' ? '#059669' : '#0891b2'}">
                    ${formatCurrency(apt.price)}
                  </td>
                  <td>${apt.status === 'completed' ? '✓ Confirmado' : '○ Agendado'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Sistema David Barber - Gestão Profissional</p>
          <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 100);
      };
    }
    
    setExportDialogOpen(false);
  };

  const pieChartData = Object.entries(financialData.paymentMethods).map(([method, value]) => ({
    name: paymentMethodLabels[method] || method,
    value,
    color: paymentMethodColors[method] || '#94a3b8'
  }));

  const renderChart = () => {
    const data = financialData.chartData.map(d => ({
      ...d,
      date: formatDate(d.date),
      'Receita (R$)': d.revenue,
      'Atendimentos': d.count
    }));

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
            <XAxis dataKey="date" stroke="#374151" className="dark:stroke-slate-400" fontSize={12} />
            <YAxis stroke="#374151" className="dark:stroke-slate-400" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '4px' }}
              itemStyle={{ color: '#e2e8f0' }}
              cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            />
            <Legend wrapperStyle={{ color: '#1f2937' }} />
            {selectedMetric === 'revenue' && (
              <Line type="monotone" dataKey="Receita (R$)" stroke={CHART_COLORS.primary} strokeWidth={3} dot={{ fill: CHART_COLORS.primary, r: 4 }} />
            )}
            {selectedMetric === 'appointments' && (
              <Line type="monotone" dataKey="Atendimentos" stroke={CHART_COLORS.secondary} strokeWidth={3} dot={{ fill: CHART_COLORS.secondary, r: 4 }} />
            )}
            {selectedMetric === 'both' && (
              <>
                <Line type="monotone" dataKey="Receita (R$)" stroke={CHART_COLORS.primary} strokeWidth={3} dot={{ fill: CHART_COLORS.primary, r: 4 }} />
                <Line type="monotone" dataKey="Atendimentos" stroke={CHART_COLORS.secondary} strokeWidth={3} dot={{ fill: CHART_COLORS.secondary, r: 4 }} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
            <XAxis dataKey="date" stroke="#374151" className="dark:stroke-slate-400" fontSize={12} />
            <YAxis stroke="#374151" className="dark:stroke-slate-400" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '4px' }}
              itemStyle={{ color: '#e2e8f0' }}
              cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            />
            <Legend wrapperStyle={{ color: '#1f2937' }} />
            {selectedMetric === 'revenue' && (
              <Bar dataKey="Receita (R$)" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
            )}
            {selectedMetric === 'appointments' && (
              <Bar dataKey="Atendimentos" fill={CHART_COLORS.secondary} radius={[8, 8, 0, 0]} />
            )}
            {selectedMetric === 'both' && (
              <>
                <Bar dataKey="Receita (R$)" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                <Bar dataKey="Atendimentos" fill={CHART_COLORS.secondary} radius={[8, 8, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
            <XAxis dataKey="date" stroke="#374151" className="dark:stroke-slate-400" fontSize={12} />
            <YAxis stroke="#374151" className="dark:stroke-slate-400" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '4px' }}
              itemStyle={{ color: '#e2e8f0' }}
              cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            />
            <Legend wrapperStyle={{ color: '#1f2937' }} />
            {selectedMetric === 'revenue' && (
              <Area type="monotone" dataKey="Receita (R$)" stroke={CHART_COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            )}
            {selectedMetric === 'appointments' && (
              <Area type="monotone" dataKey="Atendimentos" stroke={CHART_COLORS.secondary} strokeWidth={3} fillOpacity={1} fill="url(#colorAppointments)" />
            )}
            {selectedMetric === 'both' && (
              <>
                <Area type="monotone" dataKey="Receita (R$)" stroke={CHART_COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="Atendimentos" stroke={CHART_COLORS.secondary} strokeWidth={3} fillOpacity={1} fill="url(#colorAppointments)" />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  };

  const goalProgress = monthlyGoal > 0 ? (financialData.confirmedRevenue / monthlyGoal) * 100 : 0;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financeiro
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Controle completo de receitas, métricas e análises financeiras
          </p>
        </div>
        <Button 
          onClick={() => setExportDialogOpen(true)} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Exportar Relatório</DialogTitle>
            <DialogDescription>
              Escolha o formato de exportação do seu relatório financeiro
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <Button 
              onClick={exportToExcel}
              className="h-20 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-3"
              size="lg"
            >
              <FileSpreadsheet className="h-8 w-8" />
              <div className="text-left">
                <div className="font-bold text-lg">Excel / CSV</div>
                <div className="text-xs opacity-90">Ideal para análises em planilhas</div>
              </div>
            </Button>
            
            <Button 
              onClick={exportToPDF}
              className="h-20 bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center gap-3"
              size="lg"
            >
              <Printer className="h-8 w-8" />
              <div className="text-left">
                <div className="font-bold text-lg">Imprimir / PDF</div>
                <div className="text-xs opacity-90">Formato profissional para impressão</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
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
              <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger className="w-40 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">💼 Todos</SelectItem>
                  <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                  <SelectItem value="cartao">💳 Cartão</SelectItem>
                  <SelectItem value="pix">📱 PIX</SelectItem>
                  <SelectItem value="transferencia">🔄 Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="🔍 Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Receita Confirmada</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 dark:text-white">{formatCurrency(financialData.confirmedRevenue)}</div>
            <p className="text-xs text-emerald-700 dark:text-emerald-200 mt-1">{financialData.totalAppointments} atendimentos</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/50 dark:to-cyan-800/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full -mr-16 -mt-16" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-cyan-900 dark:text-cyan-100">Receita a Receber</CardTitle>
              <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-cyan-900 dark:text-white">{formatCurrency(financialData.expectedRevenue)}</div>
            <p className="text-xs text-cyan-700 dark:text-cyan-200 mt-1">{financialData.futureAppointments.length} agendamentos</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Atendimentos</CardTitle>
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 dark:text-white">{financialData.totalAppointments}</div>
            <p className="text-xs text-purple-700 dark:text-purple-200 mt-1">Ticket médio: {formatCurrency(financialData.averageTicket)}</p>
          </CardContent>
        </Card>
        
        <Dialog open={editingGoal} onOpenChange={setEditingGoal}>
          <DialogTrigger asChild>
            <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/50 dark:to-red-800/30 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
              <div className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-white/10 rounded-full">
                <Edit3 className="h-4 w-4 text-orange-600 dark:text-orange-300" />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Meta do Mês</CardTitle>
                  <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-orange-900 dark:text-white">{goalProgress.toFixed(0)}%</div>
                <p className="text-xs text-orange-700 dark:text-orange-200 mt-1">Meta: {formatCurrency(monthlyGoal)}</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Configurar Meta Mensal</DialogTitle>
              <DialogDescription>
                Defina sua meta de receita mensal para acompanhar o progresso e alcançar seus objetivos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goal" className="text-right font-medium">
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
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Progresso atual:</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(financialData.confirmedRevenue)}
                  </span>
                  <Badge variant="outline" className="text-sm">
                    {goalProgress.toFixed(1)}% da meta
                  </Badge>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.min(goalProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveGoal} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="h-4 w-4 mr-2" />
                Salvar Meta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="graphics" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <DollarSign className="h-4 w-4 mr-2" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <LineChartIcon className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Payment Methods */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Métodos de Pagamento
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Distribuição por forma de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(financialData.paymentMethods).map(([method, amount]) => {
                    const percentage = (amount / financialData.confirmedRevenue) * 100;
                    return (
                      <div key={method} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {paymentMethodIcons[method]}
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {paymentMethodLabels[method] || method}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(amount)}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: paymentMethodColors[method] || '#94a3b8'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Services/Clients */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      {topViewMode === 'services' ? 'Top Serviços' : 'Top Clientes'}
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      {topViewMode === 'services' ? 'Serviços mais rentáveis do período' : 'Clientes que mais gastaram'}
                    </CardDescription>
                  </div>
                  <Select value={topViewMode} onValueChange={setTopViewMode}>
                    <SelectTrigger className="w-32 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="services">🔧 Serviços</SelectItem>
                      <SelectItem value="clients">👥 Clientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topViewMode === 'services' ? (
                    financialData.topServices.length > 0 ? (
                      financialData.topServices.map(([service, revenue], index) => (
                        <div key={service} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs font-bold border-slate-300 dark:border-slate-600" style={{ color: Object.values(CHART_COLORS)[index % 4] }}>
                              #{index + 1}
                            </Badge>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{service}</span>
                          </div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(revenue)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        Nenhum serviço realizado no período
                      </div>
                    )
                  ) : (
                    financialData.topClients.length > 0 ? (
                      financialData.topClients.map(([name, revenue, count], index) => (
                        <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs font-bold border-slate-300 dark:border-slate-600" style={{ color: Object.values(CHART_COLORS)[index % 4] }}>
                              #{index + 1}
                            </Badge>
                            <div>
                              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{count} atendimento{count > 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(revenue)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        Nenhum cliente encontrado no período
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Pie Chart */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <PieChartIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  Distribuição de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '8px 12px'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: '4px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400">
                    Sem dados de pagamento
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Future Revenue */}
            <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-900 dark:text-white">
                  <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  Receita Futura Esperada
                </CardTitle>
                <CardDescription className="text-cyan-700 dark:text-cyan-200">
                  Agendamentos confirmados a receber
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-4xl font-bold text-cyan-700 dark:text-cyan-400 mb-2">
                    {formatCurrency(financialData.expectedRevenue)}
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {financialData.futureAppointments.length} agendamentos pendentes
                  </div>
                </div>
                
                {financialData.futureAppointments.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Próximos agendamentos:</div>
                    {financialData.futureAppointments.slice(0, 3).map((apt) => {
                      const client = clients.find(c => c.id === apt.client_id);
                      return (
                        <div key={apt.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                          <div>
                            <div className="font-medium text-sm text-slate-700 dark:text-slate-200">{client?.name || 'Cliente'}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">{apt.service_type}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-cyan-700 dark:text-cyan-400">{formatCurrency(apt.price)}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">{formatDate(apt.scheduled_date)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="graphics" className="space-y-4">
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Análise Visual de Performance
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Visualize tendências e padrões financeiros
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-40 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">💰 Receita</SelectItem>
                      <SelectItem value="appointments">📅 Atendimentos</SelectItem>
                      <SelectItem value="both">📊 Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger className="w-32 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">📈 Linha</SelectItem>
                      <SelectItem value="bar">📊 Barras</SelectItem>
                      <SelectItem value="area">🌊 Área</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {financialData.chartData.length > 0 ? (
                renderChart()
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500 dark:text-slate-400">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Comparison */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Comparativo de Receitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Confirmada', value: financialData.confirmedRevenue, fill: CHART_COLORS.primary },
                    { name: 'Futura', value: financialData.expectedRevenue, fill: CHART_COLORS.secondary },
                    { name: 'Meta', value: monthlyGoal, fill: CHART_COLORS.quaternary }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                    <XAxis dataKey="name" stroke="#374151" className="dark:stroke-slate-400" fontSize={12} />
                    <YAxis stroke="#374151" className="dark:stroke-slate-400" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '8px 12px'
                      }}
                      labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: '4px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {[
                        { name: 'Confirmada', value: financialData.confirmedRevenue, fill: CHART_COLORS.primary },
                        { name: 'Futura', value: financialData.expectedRevenue, fill: CHART_COLORS.secondary },
                        { name: 'Meta', value: monthlyGoal, fill: CHART_COLORS.quaternary }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Services Performance */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Performance por Serviço
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financialData.topServices.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart 
                      data={financialData.topServices.map(([name, value]) => ({ name, value }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                      <XAxis type="number" stroke="#374151" className="dark:stroke-slate-400" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#374151" className="dark:stroke-slate-400" fontSize={11} width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '8px 12px'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: '4px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {financialData.topServices.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400">
                    Sem dados de serviços
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Histórico de Transações
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {searchFilteredAppointments.length} transações encontradas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {financialData.completedAppointments.length} confirmadas
                  </Badge>
                  <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30">
                    <Clock className="h-3 w-3 mr-1" />
                    {financialData.futureAppointments.length} futuras
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow className="border-slate-200 dark:border-slate-700">
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Data</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Cliente</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Serviço</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Pagamento</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchFilteredAppointments.length > 0 ? (
                      searchFilteredAppointments.slice(0, 50).map((appointment) => {
                        const client = clients.find(c => c.id === appointment.client_id);
                        const isCompleted = appointment.status === 'completed';
                        return (
                          <TableRow key={appointment.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <TableCell className="font-mono text-sm text-slate-700 dark:text-slate-300">
                              {formatDateTime(appointment.scheduled_date)}
                            </TableCell>
                            <TableCell>
                              {client ? (
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-slate-200">{client.name}</div>
                                  <div className="text-xs text-slate-600 dark:text-slate-400">
                                    {client.phone}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 dark:text-slate-400">Cliente não encontrado</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-medium border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                                {appointment.service_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {appointment.payment_method ? (
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                  {paymentMethodIcons[appointment.payment_method]}
                                  <span className="text-sm">
                                    {paymentMethodLabels[appointment.payment_method]}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 dark:text-slate-400">Não definido</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isCompleted ? (
                                <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Confirmado
                                </Badge>
                              ) : (
                                <Badge className="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Agendado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-bold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
                                {formatCurrency(appointment.price)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">
                          Nenhuma transação encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {searchFilteredAppointments.length > 50 && (
                <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
                  Mostrando 50 de {searchFilteredAppointments.length} transações
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Summary Cards */}
            <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-white">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Resumo de Receitas Confirmadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(financialData.confirmedRevenue)}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 mt-1">Receita Total</div>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                      {financialData.totalAppointments}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 mt-1">Atendimentos</div>
                  </div>
                </div>
                
                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ticket Médio</span>
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(financialData.averageTicket)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Por atendimento realizado
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goal Progress */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Progresso da Meta Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-800/20 rounded-lg">
                    <div className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                      {goalProgress.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      da meta alcançada
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progresso</span>
                      <div className="flex items-center gap-2">
                        {goalProgress >= 100 ? (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">Meta atingida! 🎉</span>
                        ) : goalProgress >= 75 ? (
                          <span className="font-medium text-orange-600 dark:text-orange-400">Quase lá!</span>
                        ) : (
                          <span className="font-medium text-cyan-600 dark:text-cyan-400">Continue assim!</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-4 rounded-full transition-all duration-500 ${
                          goalProgress >= 100 
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600" 
                            : goalProgress >= 75
                            ? "bg-gradient-to-r from-orange-500 to-red-600"
                            : "bg-gradient-to-r from-cyan-500 to-cyan-600"
                        }`}
                        style={{ width: `${Math.min(goalProgress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Meta: {formatCurrency(monthlyGoal)}</span>
                      <span>
                        {goalProgress >= 100 
                          ? `Superou em: ${formatCurrency(financialData.confirmedRevenue - monthlyGoal)}`
                          : `Faltam: ${formatCurrency(Math.max(0, monthlyGoal - financialData.confirmedRevenue))}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Projection */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  Projeção de Receita Total
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Receita confirmada + receita futura esperada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 rounded-lg">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      {formatCurrency(financialData.confirmedRevenue)}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">Receita Confirmada</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/20 rounded-lg">
                    <Clock className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-1">
                      {formatCurrency(financialData.expectedRevenue)}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">Receita Futura</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-lg">
                    <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-1">
                      {formatCurrency(financialData.confirmedRevenue + financialData.expectedRevenue)}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">Projeção Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}