// @ts-nocheck
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, CreditCard, Pause, Play, Trash2, CalendarClock, CheckCircle2, Clock, XCircle, Star, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLAN_INFO = {
  basic: { name: 'Básico', color: 'from-blue-500 to-blue-600', visits: '1x/semana', icon: '🔷' },
  premium: { name: 'Premium', color: 'from-purple-500 to-violet-600', visits: '2x/semana', icon: '💎' },
  vip: { name: 'VIP', color: 'from-amber-500 to-orange-600', visits: 'Até 4x/semana', icon: '👑' }
};

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface MonthlyClientCardProps {
  client: any;
  appointments: any[];
  onViewDetails: () => void;
  onEditSchedules: () => void;
  onMarkAsPaid: () => void;
  onSuspend: () => void;
  onCancel: () => void;
}

export function MonthlyClientCard({
  client,
  appointments,
  onViewDetails,
  onEditSchedules,
  onMarkAsPaid,
  onSuspend,
  onCancel
}: MonthlyClientCardProps) {
  const clientAppointments = appointments
    .filter(apt => apt.client_id === client.client_id && apt.status !== 'cancelled' && apt.notes?.includes('Cliente Mensal'))
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const getStatusColor = () => {
    if (client.payment_status === 'overdue') return 'bg-red-500';
    const today = new Date();
    const nextPayment = new Date(client.next_payment_date);
    const daysUntilPayment = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if ((daysUntilPayment <= 7 && daysUntilPayment >= 0) || client.payment_status === 'pending') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500 shadow-md"><CheckCircle2 className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'pending': return <Badge className="bg-yellow-500 shadow-md"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'overdue': return <Badge className="bg-red-500 shadow-md animate-pulse"><XCircle className="w-3 h-3 mr-1" />Atrasado</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="outline" className="border-green-500 text-green-500 font-semibold">Ativo</Badge>;
      case 'suspended': return <Badge variant="outline" className="border-orange-500 text-orange-500 font-semibold">Suspenso</Badge>;
      case 'inactive': return <Badge variant="outline" className="border-gray-500 text-gray-500 font-semibold">Inativo</Badge>;
      default: return null;
    }
  };

  const planInfo = PLAN_INFO[client.plan_type as keyof typeof PLAN_INFO];

  return (
    <div className="relative group">
      {/* Brilho animado de fundo */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-lg blur opacity-40 group-hover:opacity-70 animate-pulse transition duration-1000"></div>
      
      {/* Badge flutuante de plano */}
      <div className="absolute -top-2.5 -right-2.5 z-10 animate-bounce">
        <div className={cn("bg-gradient-to-r text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center space-x-1 border-2 border-white", planInfo.color)}>
          <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
          <span>{planInfo.icon} {planInfo.name.toUpperCase()}</span>
          <Sparkles className="h-3 w-3 animate-pulse" />
        </div>
      </div>

      <Card className="relative h-full border-2 border-purple-300 dark:border-purple-700/50 bg-gradient-to-br from-purple-50/80 via-violet-50/50 to-pink-50/30 dark:from-purple-950/30 dark:via-violet-950/20 dark:to-pink-950/15 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-400 dark:hover:border-purple-600 flex flex-col">
        
        {/* Padrões decorativos animados */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full -mr-16 -mt-16 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/20 to-transparent rounded-full -ml-12 -mb-12 animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Estrelas decorativas flutuantes */}
        <div className="absolute top-4 left-4 animate-ping opacity-50">
          <Star className="h-2 w-2 text-yellow-400 fill-yellow-400" />
        </div>
        <div className="absolute bottom-6 right-6 animate-ping opacity-50" style={{ animationDelay: '1s' }}>
          <Star className="h-1.5 w-1.5 text-pink-400 fill-pink-400" />
        </div>

        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
                {client.client.name}
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </CardTitle>
              <CardDescription className="text-sm font-medium text-purple-700 dark:text-purple-300">
                {client.client.phone}
              </CardDescription>
            </div>
            <div className={cn("w-3 h-3 rounded-full shadow-lg", getStatusColor())} />
          </div>
          <div className="flex gap-2 pt-2 flex-wrap">
            {getStatusBadge(client.status)}
            {getPaymentStatusBadge(client.payment_status)}
          </div>
        </CardHeader>

        <CardContent className="relative z-10 flex-1 flex flex-col pb-4">
          <div className="space-y-2 bg-gradient-to-r from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Valor Mensal:</span>
              <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                R$ {Number(client.monthly_price).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Próximo Venc.:</span>
              <span className="font-semibold text-purple-700 dark:text-purple-300">
                {new Date(client.next_payment_date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 my-4">
            <div className="flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-2">
              <CalendarClock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Agendamentos ({clientAppointments.length}):
            </div>
            <div className="space-y-1 flex-1 overflow-y-auto pr-1">
              {clientAppointments.length > 0 ? (
                clientAppointments.map((apt: any, idx: number) => {
                  const aptDate = new Date(apt.scheduled_date);
                  const dayOfWeek = DAYS_OF_WEEK[aptDate.getDay()];
                  const dateStr = aptDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                  const time = aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={idx} className="grid grid-cols-3 gap-2 text-xs bg-purple-50 dark:bg-purple-950/30 rounded p-2 border border-purple-200 dark:border-purple-800">
                      <span className="font-bold text-purple-700 dark:text-purple-300">{dayOfWeek} {dateStr}</span>
                      <span className="text-center font-bold text-violet-700 dark:text-violet-300">{time}</span>
                      <span className="text-muted-foreground text-right truncate">{apt.service_type}</span>
                    </div>
                  );
                })
              ) : (
                <div className="grid grid-cols-3 gap-2 text-xs bg-purple-50 dark:bg-purple-950/30 rounded p-2 border border-purple-200 dark:border-purple-800">
                  <span className="font-medium">-</span>
                  <span className="text-center text-muted-foreground italic">Nenhum agendamento</span>
                  <span className="text-muted-foreground text-right">-</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 mt-auto">
            <div className="flex items-center justify-between text-sm pt-2 border-t border-purple-200 dark:border-purple-800">
              <span className="text-muted-foreground font-medium">Total de visitas:</span>
              <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {client.total_visits}
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950/30" onClick={onViewDetails}>
                <Eye className="w-4 h-4 mr-1" />Detalhes
              </Button>
              <Button variant="outline" size="sm" className="border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950/30" onClick={onEditSchedules} title="Editar horários">
                <Edit className="w-4 h-4" />
              </Button>
              {client.payment_status !== 'paid' && client.status === 'active' && (
                <Button variant="default" size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" onClick={onMarkAsPaid} title="Marcar como pago">
                  <CreditCard className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant={client.status === 'suspended' ? 'default' : 'outline'}
                size="sm"
                onClick={onSuspend}
                className={client.status === 'suspended' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' : 'border-orange-300 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-950/30'}
                title={client.status === 'suspended' ? 'Reativar plano' : 'Suspender plano'}
              >
                {client.status === 'suspended' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              <Button variant="destructive" size="sm" onClick={onCancel} title="Cancelar e excluir plano">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>

        {/* Barra inferior decorativa animada */}
        <div className="relative h-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 animate-shimmer bg-[length:200%_100%]"></div>
        </div>
      </Card>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}