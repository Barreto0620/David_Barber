// @ts-nocheck
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
  // Se quiser overlay escuro com blur, posso ativar:
  // DialogOverlay,
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
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

const CHART_COLORS = {
  primary: '#059669',     // emerald
  secondary: '#0891b2',   // cyan
  tertiary: '#7c3aed',    // purple
  quaternary: '#dc2626'   // red
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
  const [topViewMode, setTopViewMode] = useState('services');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('monthlyGoal', monthlyGoal.toString());
    }
  }, [monthlyGoal]);

  // Calculate financial metrics from real data
  const financialData = useMemo(() => {
    const now = new Date();
    let startDate;
    let endDate;

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    let filteredAppointments = appointments;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredAppointments = appointments.filter(apt => {
        const client = clients.find(c => c.id === apt.client_id);
        return client?.name.toLowerCase().includes(searchLower);
      });
    }

    const completedAppointments = filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_date);
      const isInPeriod = aptDate >= startDate && aptDate <= endDate;
      const isCompleted = apt.status === 'completed';
      const matchesPayment = selectedPaymentMethod === 'all' || apt.payment_method === selectedPaymentMethod;
      return isInPeriod && isCompleted && matchesPayment;
    });

    const futureAppointments = filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_date);
      const isInFuture = aptDate > now;
      const isScheduled = apt.status === 'scheduled';
      return isInFuture && isScheduled;
    });

    const confirmedRevenue = completedAppointments.reduce((sum, apt) => sum + apt.price, 0);
    const expectedRevenue  = futureAppointments.reduce((sum, apt) => sum + apt.price, 0);
    const totalAppointments = completedAppointments.length;
    const averageTicket = totalAppointments > 0 ? confirmedRevenue / totalAppointments : 0;

    const paymentMethods = completedAppointments.reduce((acc, apt) => {
      const method = apt.payment_method ?? 'não informado';
      acc[method] = (acc[method] ?? 0) + apt.price;
      return acc;
    }, {} as Record<string, number>);

    const dailyData: Record<string, { date: string; revenue: number; count: number }> = {};
    completedAppointments.forEach(apt => {
      const date = apt.scheduled_date.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, revenue: 0, count: 0 };
      }
      dailyData[date].revenue += apt.price;
      dailyData[date].count   += 1;
    });

    const chartData = Object.values(dailyData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const serviceRevenue = completedAppointments.reduce((acc, apt) => {
      acc[apt.service_type] = (acc[apt.service_type] ?? 0) + apt.price;
      return acc;
    }, {} as Record<string, number>);
    const topServices = Object.entries(serviceRevenue)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);

    const clientRevenue = completedAppointments.reduce((acc, apt) => {
      const client = clients.find(c => c.id === apt.client_id);
      if (client) {
        if (!acc[client.id]) {
          acc[client.id] = { name: client.name, revenue: 0, count: 0 };
        }
        acc[client.id].revenue += apt.price;
        acc[client.id].count   += 1;
      }
      return acc;
    }, {} as Record<string, { name: string; revenue: number; count: number }>);
    const topClients = Object.entries(clientRevenue)
      .map(([id, data]) => [data.name, data.revenue, data.count] as [string, number, number])
      .sort(([, a], [, b]) => (b as number) - (a as number))
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

  const paymentMethodIcons: Record<string, React.ReactNode> = {
    dinheiro:     <Banknote className="h-4 w-4" />,
    cartao:       <CreditCard className="h-4 w-4" />,
    pix:          <Smartphone className="h-4 w-4" />,
    transferencia:<ArrowUpDown className="h-4 w-4" />
  };
  const paymentMethodLabels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    cartao:   'Cartão',
    pix:      'PIX',
    transferencia: 'Transferência'
  };
  const paymentMethodColors: Record<string, string> = {
    dinheiro:      CHART_COLORS.primary,
    cartao:        CHART_COLORS.secondary,
    pix:           CHART_COLORS.tertiary,
    transferencia: CHART_COLORS.quaternary
  };

  // Ordenação decrescente por data (mais recente primeiro)
  const searchFilteredAppointments = useMemo(() => {
    return [...financialData.completedAppointments, ...financialData.futureAppointments]
      .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());
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
                        selectedPeriod === 'week'  ? 'Últimos 7 dias' :
                        selectedPeriod === 'month' ? 'Este mês' : 'Este ano';

    const csvContent = [
      ['RELATÓRIO FINANCEIRO - DAVID BARBER'],
      ['Período:', periodLabel],
      ['Data de Geração:', new Date().toLocaleString('pt-BR')],
      [''],
      ['RESUMO'],
      ['Receita Confirmada:', formatCurrency(financialData.confirmedRevenue)],
      ['Receita a Receber:', formatCurrency(financialData.expectedRevenue)],
      ['Total de Atendimentos:', financialData.totalAppointments.toString()],
      ['Ticket Médio:', formatCurrency(financialData.averageTicket)],
      [''],
      ['TRANSAÇÕES DETALHADAS - ORDEM DECRESCENTE (MAIS RECENTE PRIMEIRO)'],
      ['Data', 'Cliente', 'Telefone', 'Serviço', 'Valor', 'Pagamento', 'Status'],
      ...searchFilteredAppointments.map(apt => {
        const client = clients.find(c => c.id === apt.client_id);
        return [
          formatDateTime(apt.scheduled_date),
          client?.name ?? 'N/A',
          client?.phone ?? 'N/A',
          apt.service_type,
          `R$ ${apt.price.toFixed(2)}`,
          paymentMethodLabels[apt.payment_method] ?? 'N/A',
          apt.status === 'completed' ? 'Confirmado' : 'Agendado'
        ];
      })
    ].map(row => row.join(';')).join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `financeiro-${selectedPeriod}-${formatDate(new Date())}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setExportDialogOpen(false);
  };

  const exportToPDF = () => {
    const periodLabel = selectedPeriod === 'today' ? 'Hoje' :
                        selectedPeriod === 'week'  ? 'Últimos 7 dias' :
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
.section-title { margin: 30px 0 15px 0; padding: 10px 0; border-bottom: 2px solid #059669; }
.section-title h2 { font-size: 18px; color: #059669; }
.section-title .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th { background: #059669; color: white; padding: 12px; text-align: left; font-weight: 600; }
td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
tr:nth-child(even) { background: #f9fafb; }
.footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
@media print { body { padding: 0; } .header { border-radius: 0; } }
</style>
</head>
<body>
<div class="header">
  <h1>DAVID BARBER</h1>
  <p>Relatório Financeiro Profissional</p>
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
<div class="section-title">
  <h2>Transações Detalhadas</h2>
  <div class="subtitle">Ordenadas por data (mais recente primeiro) • ${searchFilteredAppointments.length} transações</div>
</div>
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
        <td>${client?.name ?? 'N/A'}</td>
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
    name: paymentMethodLabels[method] ?? method,
    method,
    value,
    color: paymentMethodColors[method] ?? '#94a3b8'
  }));

  const renderChart = () => {
    const data = financialData.chartData.map(d => ({
      ...d,
      date: formatDate(d.date),
      'Receita (R$)': d.revenue,
      'Atendimentos': d.count
    }));
    const customTooltipFormatter = (value: unknown, name: string) => {
      if (name === 'Receita (R$)') {
        return [formatCurrency(value as number), 'Receita'];
      } else if (name === 'Atendimentos') {
        return [value, 'Atendimentos'];
      }
      return [value, name];
    };

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
            <XAxis dataKey="date" stroke="#374151" className="dark:stroke-slate-400" fontSize={10} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#374151" className="dark:stroke-slate-400" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a', // mais escuro
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#f8fafc', fontWeight: 700, marginBottom: '4px' }}
              itemStyle={{ color: '#e2e8f0' }}
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              position={{ y: 0 }}
              formatter={customTooltipFormatter}
            />
            <Legend wrapperStyle={{ color: '#1f2937', fontSize: '12px' }} />
            {selectedMetric === 'revenue' && (
              <Line type="monotone" dataKey="Receita (R$)" stroke={CHART_COLORS.primary} strokeWidth={3} dot={{ fill: CHART_COLORS.primary, r: 4 }} />
            )}
            {selectedMetric === 'appointments' && (
              <Line type="monotone" dataKey="Atendimentos" stroke={CHART_COLORS.secondary} strokeWidth={3} dot={{ fill: CHART_COLORS.secondary, r: 4 }} />
            )}
            {selectedMetric === 'both' && (
              <>
                <Line type="monotone" dataKey="Receita (R$)"   stroke={CHART_COLORS.primary}   strokeWidth={3} dot={{ fill: CHART_COLORS.primary, r: 4 }} />
                <Line type="monotone" dataKey="Atendimentos"    stroke={CHART_COLORS.secondary} strokeWidth={3} dot={{ fill: CHART_COLORS.secondary, r: 4 }} />
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
            <XAxis dataKey="date" stroke="#374151" className="dark:stroke-slate-400" fontSize={10} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#374151" className="dark:stroke-slate-400" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#fff',
                padding: '10px 14px',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#fff', fontWeight: 700, marginBottom: '4px' }}
              itemStyle={{ color: '#e2e8f0' }}
              formatter={(v) => customTooltipFormatter(v, 'Receita (R$)')}
            />
            <Legend wrapperStyle={{ color: '#1f2937', fontSize: '12px' }} />
            {selectedMetric === 'revenue'      && <Bar dataKey="Receita (R$)"  fill={CHART_COLORS.primary}   radius={[8, 8, 0, 0]} />}
            {selectedMetric === 'appointments' && <Bar dataKey="Atendimentos"   fill={CHART_COLORS.secondary} radius={[8, 8, 0, 0]} />}
            {selectedMetric === 'both' && (
              <>
                <Bar dataKey="Receita (R$)"  fill={CHART_COLORS.primary}   radius={[8, 8, 0, 0]} />
                <Bar dataKey="Atendimentos"   fill={CHART_COLORS.secondary} radius={[8, 8, 0, 0]} />
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
                <stop offset="5%"  stopColor={CHART_COLORS.primary}   stopOpacity={0.45}/>
                <stop offset="95%" stopColor={CHART_COLORS.primary}   stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLORS.secondary} stopOpacity={0.45}/>
                <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
            <XAxis dataKey="date" stroke="#374151" className="dark:stroke-slate-400" fontSize={10} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#374151" className="dark:stroke-slate-400" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#f8fafc', fontWeight: 700, marginBottom: '4px' }}
              itemStyle={{ color: '#e2e8f0' }}
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              formatter={customTooltipFormatter}
            />
            <Legend wrapperStyle={{ color: '#1f2937', fontSize: '12px' }} />
            {selectedMetric === 'revenue'      && <Area type="monotone" dataKey="Receita (R$)"  stroke={CHART_COLORS.primary}   strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />}
            {selectedMetric === 'appointments' && <Area type="monotone" dataKey="Atendimentos"   stroke={CHART_COLORS.secondary} strokeWidth={3} fillOpacity={1} fill="url(#colorAppointments)" />}
            {selectedMetric === 'both' && (
              <>
                <Area type="monotone" dataKey="Receita (R$)"  stroke={CHART_COLORS.primary}   strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="Atendimentos"   stroke={CHART_COLORS.secondary} strokeWidth={3} fillOpacity={1} fill="url(#colorAppointments)" />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  };

  const goalProgress = monthlyGoal > 0 ? (financialData.confirmedRevenue / monthlyGoal) * 100 : 0;

  return (
    <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Financeiro
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Controle completo de receitas, métricas e análises financeiras
          </p>
        </div>

        <Button
          onClick={() => setExportDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-11 text-base font-bold border-2 border-emerald-700 active:scale-95 transition-transform"
          size="lg"
        >
          <Download className="h-5 w-5 sm:mr-2" />
          <span className="hidden xs:inline">Exportar Relatório</span>
          <span className="xs:hidden">Exportar</span>
        </Button>
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        {/* Se quiser overlay com blur, habilite e aplique sua classe:
            <DialogOverlay className="appointment-modal-overlay" />
        */}
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[425px] mx-auto rounded-lg border-2 border-emerald-700 bg-slate-950/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl text-emerald-300 font-extrabold">Exportar Relatório</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-emerald-200">
              Escolha o formato de exportação do seu relatório financeiro
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-4 sm:py-6">
            <Button
              onClick={exportToExcel}
              className="h-16 sm:h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-3 border-2 border-emerald-700 active:scale-95"
              size="lg"
            >
              <FileSpreadsheet className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold text-base sm:text-lg">Excel / CSV</div>
                <div className="text-xs opacity-90">Ideal para análises em planilhas</div>
              </div>
            </Button>
            <Button
              onClick={exportToPDF}
              className="h-16 sm:h-20 bg-cyan-600 hover:bg-cyan-700 text-white font-bold flex items-center justify-center gap-3 border-2 border-cyan-700 active:scale-95"
              size="lg"
            >
              <Printer className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold text-base sm:text-lg">Imprimir / PDF</div>
                <div className="text-xs opacity-90">Formato profissional para impressão</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="border-2 border-slate-700 bg-slate-950/90 backdrop-blur-sm shadow-lg">
        <CardContent className="p-3 sm:p-4 md:pt-6">
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Linha 1: Período e Pagamento */}
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Calendar className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="flex-1 h-10 border-2 border-emerald-600 bg-slate-950/60 text-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border border-emerald-700">
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">7 dias</SelectItem>
                    <SelectItem value="month">Este mês</SelectItem>
                    <SelectItem value="year">Este ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Filter className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger className="flex-1 h-10 border-2 border-cyan-600 bg-slate-950/60 text-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border border-cyan-700">
                    <SelectItem value="all">💼 Todos</SelectItem>
                    <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                    <SelectItem value="cartao">💳 Cartão</SelectItem>
                    <SelectItem value="pix">📱 PIX</SelectItem>
                    <SelectItem value="transferencia">🔄 Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2: Busca */}
            <Input
              placeholder="🔍 Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 border-2 border-purple-600 bg-slate-950/60 text-purple-100 placeholder:text-purple-300 focus-visible:ring-2 focus-visible:ring-purple-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
        {/* Receita Confirmada */}
        <Card className="border-2 border-emerald-700 bg-gradient-to-br from-emerald-900/70 to-emerald-800/60 backdrop-blur-sm relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-500/20 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
          <CardHeader className="relative px-3 sm:px-6 pt-3 sm:pt-6 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-bold text-emerald-200 truncate pr-2">
                Receita Confirmada
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="relative px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-extrabold text-white truncate">
              {formatCurrency(financialData.confirmedRevenue)}
            </div>
            <p className="text-[10px] sm:text-xs text-emerald-200 mt-1 truncate">
              {financialData.totalAppointments} atendimentos
            </p>
          </CardContent>
        </Card>

        {/* Receita a Receber */}
        <Card className="border-2 border-cyan-700 bg-gradient-to-br from-cyan-900/70 to-cyan-800/60 backdrop-blur-sm relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-cyan-500/20 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
          <CardHeader className="relative px-3 sm:px-6 pt-3 sm:pt-6 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-bold text-cyan-200 truncate pr-2">
                Receita a Receber
              </CardTitle>
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="relative px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-extrabold text-white truncate">
              {formatCurrency(financialData.expectedRevenue)}
            </div>
            <p className="text-[10px] sm:text-xs text-cyan-200 mt-1 truncate">
              {financialData.futureAppointments.length} agendamentos
            </p>
          </CardContent>
        </Card>

        {/* Atendimentos */}
        <Card className="border-2 border-purple-700 bg-gradient-to-br from-purple-900/70 to-purple-800/60 backdrop-blur-sm relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-purple-500/20 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
          <CardHeader className="relative px-3 sm:px-6 pt-3 sm:pt-6 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-bold text-purple-200 truncate pr-2">
                Atendimentos
              </CardTitle>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="relative px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {financialData.totalAppointments}
            </div>
            <p className="text-[10px] sm:text-xs text-purple-200 mt-1 truncate">
              Ticket médio: {formatCurrency(financialData.averageTicket)}
            </p>
          </CardContent>
        </Card>

        {/* Meta do Mês (Trigger) */}
        <Dialog open={editingGoal} onOpenChange={setEditingGoal}>
          <DialogTrigger asChild>
            <Card className="border-2 border-orange-700 bg-gradient-to-br from-orange-900/70 to-red-800/60 backdrop-blur-sm relative overflow-hidden cursor-pointer hover:shadow-xl transition-all shadow-lg">
              <div className="absolute bottom-2 right-2 p-1 sm:p-1.5 bg-white/10 rounded-full">
                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 text-orange-300" />
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-orange-500/20 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
              <CardHeader className="relative px-3 sm:px-6 pt-3 sm:pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs sm:text-sm font-bold text-orange-200 truncate pr-2">
                    Meta do Mês
                  </CardTitle>
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-300 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="relative px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  {goalProgress.toFixed(0)}%
                </div>
                <p className="text-[10px] sm:text-xs text-orange-200 mt-1 truncate">
                  Meta: {formatCurrency(monthlyGoal)}
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>

          {/* Dialog Meta do Mês */}
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[425px] mx-auto rounded-lg border-2 border-orange-700 bg-slate-950/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-2xl text-orange-300 font-extrabold">Configurar Meta Mensal</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-orange-200">
                Defina sua meta de receita mensal para acompanhar o progresso e alcançar seus objetivos.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3 sm:gap-4">
                <Label htmlFor="goal" className="sm:text-right font-bold text-orange-200">
                  Meta (R$)
                </Label>
                <Input
                  id="goal"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  placeholder="5000"
                  className="sm:col-span-3 h-11 bg-slate-900/80 text-orange-100 border-2 border-orange-600 focus-visible:ring-2 focus-visible:ring-orange-400"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="bg-slate-900/80 p-3 sm:p-4 rounded-lg border border-slate-700">
                <div className="text-xs sm:text-sm text-slate-300 mb-2">Progresso atual:</div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                    {formatCurrency(financialData.confirmedRevenue)}
                  </span>
                  <Badge variant="outline" className="text-xs sm:text-sm border-emerald-700 text-emerald-300">
                    {goalProgress.toFixed(1)}% da meta
                  </Badge>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.min(goalProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="w-full sm:w-auto h-11 border-2 border-slate-600 text-slate-200 hover:bg-slate-800/50 active:scale-95"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSaveGoal}
                className="w-full sm:w-auto h-11 bg-orange-600 hover:bg-orange-700 border-2 border-orange-700 active:scale-95"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-3 sm:space-y-4">
        <TabsList className="bg-slate-950/90 backdrop-blur-sm border-2 border-slate-700 w-full h-auto grid grid-cols-2 sm:grid-cols-4 p-1 gap-1">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-slate-800 text-xs sm:text-sm py-2 font-bold"
          >
            <PieChartIcon className="h-4 w-4 sm:mr-2 text-cyan-400" />
            <span className="hidden xs:inline">Visão Geral</span>
            <span className="xs:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger
            value="graphics"
            className="data-[state=active]:bg-slate-800 text-xs sm:text-sm py-2 font-bold"
          >
            <BarChart3 className="h-4 w-4 sm:mr-2 text-emerald-400" />
            <span className="hidden xs:inline">Gráficos</span>
            <span className="xs:hidden">Gráf.</span>
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-slate-800 text-xs sm:text-sm py-2 font-bold"
          >
            <DollarSign className="h-4 w-4 sm:mr-2 text-purple-400" />
            <span className="hidden xs:inline">Transações</span>
            <span className="xs:hidden">Trans.</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-slate-800 text-xs sm:text-sm py-2 font-bold"
          >
            <LineChartIcon className="h-4 w-4 sm:mr-2 text-orange-400" />
            <span className="hidden xs:inline">Analytics</span>
            <span className="xs:hidden">Anál.</span>
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            {/* Métodos de Pagamento */}
            <Card className="border-2 border-slate-700 bg-slate-950/90 backdrop-blur-sm shadow-lg">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg font-extrabold">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">Métodos de Pagamento</span>
                </CardTitle>
                <CardDescription className="text-slate-300 text-xs sm:text-sm">
                  Distribuição por forma de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                  {Object.entries(financialData.paymentMethods).map(([method, amount]) => {
                    const percentage = (amount / financialData.confirmedRevenue) * 100;
                    return (
                      <div key={method} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {paymentMethodIcons[method]}
                            <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                              {paymentMethodLabels[method] ?? method}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-extrabold text-emerald-400 text-sm sm:text-base">
                              {formatCurrency(amount)}
                            </div>
                            <div className="text-[10px] sm:text-xs text-slate-300">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 sm:h-2.5">
                          <div
                            className="h-2 sm:h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: paymentMethodColors[method] ?? '#94a3b8'
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
            <Card className="border-2 border-slate-700 bg-slate-950/90 backdrop-blur-sm shadow-lg">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg font-extrabold">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{topViewMode === 'services' ? 'Top Serviços' : 'Top Clientes'}</span>
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-xs sm:text-sm truncate">
                      {topViewMode === 'services' ? 'Serviços mais rentáveis' : 'Clientes que mais gastaram'}
                    </CardDescription>
                  </div>
                  <Select value={topViewMode} onValueChange={setTopViewMode}>
                    <SelectTrigger className="w-24 sm:w-32 h-9 border-2 border-purple-600 bg-slate-950/60 text-purple-100 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border border-purple-700">
                      <SelectItem value="services">🔧 Serviços</SelectItem>
                      <SelectItem value="clients">👥 Clientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="space-y-2 sm:space-y-3">
                  {topViewMode === 'services' ? (
                    financialData.topServices.length > 0 ? (
                      financialData.topServices.map(([service, revenue], index) => (
                        <div key={service} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800/80 transition-colors gap-2 border border-slate-700">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <Badge variant="outline" className="text-xs font-extrabold border-purple-600 text-purple-300 flex-shrink-0" style={{ color: Object.values(CHART_COLORS)[index % 4] }}>
                              #{index + 1}
                            </Badge>
                            <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">{service}</span>
                          </div>
                          <div className="font-extrabold text-emerald-400 text-xs sm:text-sm flex-shrink-0">
                            {formatCurrency(revenue as number)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-slate-300 text-xs sm:text-sm">
                        Nenhum serviço realizado no período
                      </div>
                    )
                  ) : (
                    financialData.topClients.length > 0 ? (
                      financialData.topClients.map(([name, revenue, count], index) => (
                        <div key={name} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800/80 transition-colors gap-2 border border-slate-700">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <Badge variant="outline" className="text-xs font-extrabold border-purple-600 text-purple-300 flex-shrink-0" style={{ color: Object.values(CHART_COLORS)[index % 4] }}>
                              #{index + 1}
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-bold text-slate-200 truncate">{name}</div>
                              <div className="text-[10px] sm:text-xs text-slate-300">{count} atendimento{count > 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          <div className="font-extrabold text-emerald-400 text-xs sm:text-sm flex-shrink-0">
                            {formatCurrency(revenue)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-slate-300 text-xs sm:text-sm">
                        Nenhum cliente encontrado no período
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pizza Pagamentos */}
            <Card className="border-2 border-slate-700 bg-slate-950/90 backdrop-blur-sm shadow-lg">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg font-extrabold">
                  <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
                  <span className="truncate">Distribuição de Pagamentos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }: { percent?: number }) => `${(((percent ?? 0) * 100)).toFixed(0)}%`}
                        outerRadius={70}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '10px',
                          color: '#fff',
                          padding: '10px 14px',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 700, marginBottom: '4px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(value: unknown) => formatCurrency(value as number)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-slate-300 text-xs sm:text-sm">
                    Sem dados de pagamento
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Receita Futura */}
            <Card className="border-2 border-cyan-700 bg-gradient-to-br from-cyan-900/60 to-cyan-800/50 backdrop-blur-sm shadow-lg">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg font-extrabold">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
                  <span className="truncate">Receita Futura Esperada</span>
                </CardTitle>
                <CardDescription className="text-cyan-200 text-xs sm:text-sm">
                  Agendamentos confirmados a receber
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
                <div className="text-center p-4 sm:p-6 bg-slate-900/60 rounded-lg border border-cyan-700">
                  <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 mb-2 truncate">
                    {formatCurrency(financialData.expectedRevenue)}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300">
                    {financialData.futureAppointments.length} agendamentos pendentes
                  </div>
                </div>

                {financialData.futureAppointments.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs sm:text-sm font-bold text-slate-300">Próximos agendamentos:</div>
                    {financialData.futureAppointments.slice(0, 3).map((apt) => {
                      const client = clients.find(c => c.id === apt.client_id);
                      return (
                        <div key={apt.id} className="flex items-center justify-between p-2 sm:p-3 bg-slate-900/60 rounded-lg gap-2 border border-cyan-700">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs sm:text-sm text-slate-200 truncate">{client?.name ?? 'Cliente'}</div>
                            <div className="text-[10px] sm:text-xs text-slate-300 truncate">{apt.service_type}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-extrabold text-cyan-400 text-xs sm:text-sm">{formatCurrency(apt.price)}</div>
                            <div className="text-[10px] sm:text-xs text-slate-300">{formatDate(apt.scheduled_date)}</div>
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

        {/* GRAPHICS */}
        <TabsContent value="graphics" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <Card className="border-2 border-slate-700 bg-slate-950/90 backdrop-blur-sm shadow-lg">
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg font-extrabold">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">Análise Visual de Performance</span>
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-xs sm:text-sm">
                    Visualize tendências e padrões financeiros
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-full xs:w-32 sm:w-40 h-9 border-2 border-emerald-600 bg-slate-950/60 text-emerald-100 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border border-emerald-700">
                      <SelectItem value="revenue">💰 Receita</SelectItem>
                      <SelectItem value="appointments">📅 Atendimentos</SelectItem>
                      <SelectItem value="both">📊 Ambos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger className="w-full xs:w-28 sm:w-32 h-9 border-2 border-cyan-600 bg-slate-950/60 text-cyan-100 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border border-cyan-700">
                      <SelectItem value="line">📈 Linha</SelectItem>
                      <SelectItem value="bar">📊 Barras</SelectItem>
                      <SelectItem value="area">🌊 Área</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {financialData.chartData.length > 0 ? (
                renderChart()
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-300 text-xs sm:text-sm px-4 text-center">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            {/* Comparativo de Receitas */}
            <Card className="border-2 border-slate-700 bg-slate-950/90 backdrop-blur-sm shadow-lg">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg font-extrabold">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">Comparativo de Receitas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { name: 'Confirmada', valor: financialData.confirmedRevenue, fill: CHART_COLORS.primary },
                    { name: 'Futura',     valor: financialData.expectedRevenue,  fill: CHART_COLORS.secondary },
                    { name: 'Meta',       valor: monthlyGoal,                    fill: CHART_COLORS.quaternary }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                    <XAxis dataKey="name" stroke="#374151" className="dark:stroke-slate-400" fontSize={10} />
                    <YAxis stroke="#374151" className="dark:stroke-slate-400" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        color: '#fff',
                        padding: '10px 14px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#fff', fontWeight: 700, marginBottom: '4px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(value: unknown) => formatCurrency(value as number)}
                    />
                    <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                      {[
                        { name: 'Confirmada', valor: financialData.confirmedRevenue, fill: CHART_COLORS.primary },
                        { name: 'Futura',     valor: financialData.expectedRevenue,  fill: CHART_COLORS.secondary },
                        { name: 'Meta',       valor: monthlyGoal,                    fill: CHART_COLORS.quaternary }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance por Serviço */}
            <Card className="border-2 border-slate-700 bg-slate-950/90 backdrop-blur-sm shadow-lg">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg font-extrabold">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 flex-shrink-0" />
                  <span className="truncate">Performance por Serviço</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                {financialData.topServices.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={financialData.topServices.map(([name, value]) => ({ name, valor: value }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                      <XAxis type="number"   stroke="#374151" className="dark:stroke-slate-400" fontSize={10} />
                      <YAxis dataKey="name"  type="category" stroke="#374151" className="dark:stroke-slate-400" fontSize={10} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '10px',
                          color: '#fff',
                          padding: '10px 14px',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 700, marginBottom: '4px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(value: unknown) => formatCurrency(value as number)}
                      />
                      <Bar dataKey="valor" radius={[0, 8, 8, 0]}>
                        {financialData.topServices.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-slate-300 text-xs sm:text-sm">
                    Sem dados de serviços
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TRANSACTIONS */}
        <TabsContent value="transactions" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <Card className="border-2 border-slate-700 bg-slate-950/90 backdrop-blur-sm shadow-lg">
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg font-extrabold">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">Histórico de Transações</span>
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-xs sm:text-sm">
                    {searchFilteredAppointments.length} transações • Ordenadas por data (mais recente primeiro)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-cyan-900/50 text-cyan-300 border-cyan-700 text-xs self-start xs:self-auto">
                  <Clock className="h-3 w-3 mr-1" />
                  {financialData.futureAppointments.length} futuras
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="px-0 sm:px-6 pb-3 sm:pb-6">
              {/* Mobile cards */}
              <div className="sm:hidden space-y-2 px-3">
                {searchFilteredAppointments.length > 0 ? (
                  searchFilteredAppointments.slice(0, 50).map((appointment) => {
                    const client = clients.find(c => c.id === appointment.client_id);
                    const isCompleted = appointment.status === 'completed';
                    return (
                      <div key={appointment.id} className="p-3 bg-slate-800/70 rounded-lg space-y-2 border-2 border-slate-700">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-slate-200 truncate">
                              {client?.name ?? 'Cliente não encontrado'}
                            </div>
                            <div className="text-xs text-slate-300 truncate">
                              {client?.phone}
                            </div>
                          </div>
                          <span className={cn(
                            "font-extrabold text-sm flex-shrink-0",
                            isCompleted ? 'text-emerald-400' : 'text-cyan-400'
                          )}>
                            {formatCurrency(appointment.price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-bold border-purple-600 text-purple-300 text-xs">
                            {appointment.service_type}
                          </Badge>
                          {isCompleted ? (
                            <Badge className="bg-emerald-800/50 text-emerald-300 border border-emerald-700 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Confirmado
                            </Badge>
                          ) : (
                            <Badge className="bg-cyan-800/50 text-cyan-300 border border-cyan-700 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Agendado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-700">
                          <span>{formatDateTime(appointment.scheduled_date)}</span>
                          {appointment.payment_method && (
                            <div className="flex items-center gap-1">
                              {paymentMethodIcons[appointment.payment_method]}
                              <span>{paymentMethodLabels[appointment.payment_method]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-300 text-sm">
                    Nenhuma transação encontrada
                  </div>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block rounded-lg border-2 border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-800/70">
                    <TableRow className="border-slate-700">
                      <TableHead className="font-bold text-slate-200">Data</TableHead>
                      <TableHead className="font-bold text-slate-200">Cliente</TableHead>
                      <TableHead className="font-bold text-slate-200">Serviço</TableHead>
                      <TableHead className="font-bold text-slate-200">Pagamento</TableHead>
                      <TableHead className="font-bold text-slate-200">Status</TableHead>
                      <TableHead className="text-right font-bold text-slate-200">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchFilteredAppointments.length > 0 ? (
                      searchFilteredAppointments.slice(0, 50).map((appointment) => {
                        const client = clients.find(c => c.id === appointment.client_id);
                        const isCompleted = appointment.status === 'completed';
                        return (
                          <TableRow key={appointment.id} className="border-slate-700 hover:bg-slate-800/60">
                            <TableCell className="font-mono text-sm text-slate-300">
                              {formatDateTime(appointment.scheduled_date)}
                            </TableCell>
                            <TableCell>
                              {client ? (
                                <div>
                                  <div className="font-bold text-slate-200">{client.name}</div>
                                  <div className="text-xs text-slate-300">
                                    {client.phone}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-300">Cliente não encontrado</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-bold border-purple-600 text-purple-300">
                                {appointment.service_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {appointment.payment_method ? (
                                <div className="flex items-center gap-2 text-slate-300">
                                  {paymentMethodIcons[appointment.payment_method]}
                                  <span className="text-sm">
                                    {paymentMethodLabels[appointment.payment_method]}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">Não definido</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isCompleted ? (
                                <Badge className="bg-emerald-800/50 text-emerald-300 border border-emerald-700">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Confirmado
                                </Badge>
                              ) : (
                                <Badge className="bg-cyan-800/50 text-cyan-300 border border-cyan-700">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Agendado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`${isCompleted ? 'text-emerald-400' : 'text-cyan-400'} font-extrabold`}>
                                {formatCurrency(appointment.price)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-300">
                          Nenhuma transação encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {searchFilteredAppointments.length > 50 && (
                <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-slate-300 px-3 sm:px-0">
                  Mostrando 50 de {searchFilteredAppointments.length} transações
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            {/* Resumo */}
            <Card className="border-2 border-emerald-700 bg-gradient-to-br from-emerald-900/60 to-emerald-800/50 backdrop-blur-sm shadow-lg">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg font-extrabold">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">Resumo de Receitas Confirmadas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-slate-900/70 rounded-lg border border-emerald-700">
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 truncate">
                      {formatCurrency(financialData.confirmedRevenue)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-300 mt-1">Receita Total</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-slate-900/70 rounded-lg border border-emerald-700">
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                      {financialData.totalAppointments}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-300 mt-1">Atendimentos</div>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-slate-900/70 rounded-lg border border-emerald-700">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-300">Ticket Médio</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 truncate">
                      {formatCurrency(financialData.averageTicket)}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-300">
                    Por atendimento realizado
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progresso da Meta */}
            <Card className="border-2 border-slate-700 bg-slate-950/90 backdrop-blur-sm shadow-lg">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg font-extrabold">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400 flex-shrink-0" />
                  <span className="truncate">Progresso da Meta Mensal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-orange-900/50 to-red-800/40 rounded-lg border border-orange-700">
                    <div className="text-4xl sm:text-5xl font-extrabold text-orange-300 mb-2">
                      {goalProgress.toFixed(1)}%
                    </div>
                    <div className="text-xs sm:text-sm text-slate-300">
                      da meta alcançada
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] sm:text-xs">
                      <span className="font-bold text-slate-300">Progresso</span>
                      <div className="flex items-center gap-2">
                        {goalProgress >= 100 ? (
                          <span className="font-bold text-emerald-400">Meta atingida! 🎉</span>
                        ) : goalProgress >= 75 ? (
                          <span className="font-bold text-orange-300">Quase lá!</span>
                        ) : (
                          <span className="font-bold text-cyan-300">Continue assim!</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 sm:h-4 overflow-hidden">
                      <div
                        className={cn(
                          "h-3 sm:h-4 rounded-full transition-all duration-500",
                          goalProgress >= 100
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                            : goalProgress >= 75
                            ? "bg-gradient-to-r from-orange-500 to-red-600"
                            : "bg-gradient-to-r from-cyan-500 to-cyan-600"
                        )}
                        style={{ width: `${Math.min(goalProgress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] sm:text-xs text-slate-300 flex-wrap gap-1">
                      <span>Meta: {formatCurrency(monthlyGoal)}</span>
                      <span className="text-right">
                        {goalProgress >= 100
                          ? `Superou: ${formatCurrency(financialData.confirmedRevenue - monthlyGoal)}`
                          : `Faltam: ${formatCurrency(Math.max(0, monthlyGoal - financialData.confirmedRevenue))}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projeção Total */}
            <Card className="border-2 border-slate-700 bg-slate-950/90 backdrop-blur-sm md:col-span-2 shadow-lg">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg font-extrabold">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
                  <span className="truncate">Projeção de Receita Total</span>
                </CardTitle>
                <CardDescription className="text-slate-300 text-xs sm:text-sm">
                  Receita confirmada + receita futura esperada
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-emerald-900/50 to-emerald-800/40 rounded-lg border border-emerald-700">
                    <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400 mx-auto mb-2 sm:mb-3" />
                    <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mb-1 truncate">
                      {formatCurrency(financialData.confirmedRevenue)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-300">Receita Confirmada</div>
                  </div>
                  <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-cyan-900/50 to-cyan-800/40 rounded-lg border border-cyan-700">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400 mx-auto mb-2 sm:mb-3" />
                    <div className="text-xl sm:text-2xl font-extrabold text-cyan-400 mb-1 truncate">
                      {formatCurrency(financialData.expectedRevenue)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-300">Receita Futura</div>
                  </div>
                  <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-purple-900/50 to-purple-800/40 rounded-lg border border-purple-700">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 mx-auto mb-2 sm:mb-3" />
                    <div className="text-xl sm:text-2xl font-extrabold text-purple-400 mb-1 truncate">
                      {formatCurrency(financialData.confirmedRevenue + financialData.expectedRevenue)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-300">Projeção Total</div>
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