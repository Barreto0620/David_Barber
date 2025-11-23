// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MonthlySchedulePicker } from '@/components/monthly-clients/schedule-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserCheck, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const PLAN_TYPES = [
  { 
    value: 'premium', 
    label: 'Premium', 
    price: 150, 
    description: '2 visitas por semana',
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-pink-500',
    icon: '💎',
    minSchedules: 2,
    maxSchedules: 2
  },
  { 
    value: 'vip', 
    label: 'VIP', 
    price: 250, 
    description: 'Até 4 visitas por semana',
    color: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    icon: '👑',
    minSchedules: 2,
    maxSchedules: 4
  },
];

interface AddMonthlyClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedClientId?: string;
}

export function AddMonthlyClientModal({ 
  open, 
  onClose, 
  onSuccess,
  preSelectedClientId
}: AddMonthlyClientModalProps) {
  const { clients, addMonthlyClient, monthlyClients } = useAppStore();
  
  const [step, setStep] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [planType, setPlanType] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState<Array<{
    date: string;
    time: string;
    serviceType: string;
  }>>([]);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setSelectedClientId('');
        setPlanType('');
        setCustomPrice('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setSchedules([]);
        setNotes('');
        setSearchTerm('');
      }, 200);
    }
  }, [open]);

  useEffect(() => {
    if (open && preSelectedClientId) {
      setSelectedClientId(preSelectedClientId);
      setStep(2);
    }
  }, [open, preSelectedClientId]);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedPlan = PLAN_TYPES.find(p => p.value === planType);

  const availableClients = clients.filter(client => {
    const hasActivePlan = monthlyClients.some(
      mc => mc.client_id === client.id && mc.status === 'active'
    );
    return !hasActivePlan;
  });

  const filteredClients = availableClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const canProceedStep1 = selectedClientId !== '';
  const canProceedStep2 = planType !== '';
  const canProceedStep3 = selectedPlan && 
    schedules.length >= selectedPlan.minSchedules && 
    schedules.length <= selectedPlan.maxSchedules;

  const handleSubmit = async () => {
    if (!selectedClient || !selectedPlan) return;

    setIsSubmitting(true);

    try {
      const finalPrice = customPrice ? parseFloat(customPrice) : selectedPlan.price;

      // 🔥 CORREÇÃO: Envia cada data como um agendamento individual
      // Não agrupa por dia da semana - cada data escolhida é única
      const convertedSchedules = schedules.map(schedule => {
        const [year, month, day] = schedule.date.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        return {
          // Mantém a data COMPLETA para criar agendamento específico
          fullDate: schedule.date,
          dayOfWeek: date.getDay(),
          time: schedule.time,
          serviceType: schedule.serviceType
        };
      });

      console.log('📅 Datas específicas sendo enviadas:', convertedSchedules);

      const result = await addMonthlyClient({
        clientId: selectedClient.id,
        planType: planType as 'premium' | 'vip',
        monthlyPrice: finalPrice,
        startDate: startDate,
        schedules: convertedSchedules,
        notes: notes || undefined
      });

      if (result) {
        toast.success(`✅ Cliente mensal criado! ${convertedSchedules.length} agendamentos gerados.`);
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao criar plano mensal:', error);
      toast.error('Erro ao criar plano mensal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((num) => (
        <div key={num} className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
            step === num 
              ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
              : step > num 
              ? "bg-green-500 text-white"
              : "bg-muted text-muted-foreground"
          )}>
            {step > num ? <CheckCircle2 className="w-4 h-4" /> : num}
          </div>
          {num < 4 && (
            <div className={cn(
              "w-12 h-0.5 mx-1",
              step > num ? "bg-green-500" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-5xl max-h-[90vh] overflow-y-auto !bg-zinc-950 dark:!bg-zinc-950 border-zinc-800 shadow-2xl"
        style={{ 
          backgroundColor: '#09090b',
          backgroundImage: 'none',
          opacity: 1,
          zIndex: 50,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Adicionar Cliente Mensal
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-zinc-400">
            Transforme um cliente em assinante mensal com agendamentos recorrentes
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-white">
                <UserCheck className="w-5 h-5 text-blue-500" />
                Selecione o Cliente
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                Escolha um cliente existente para transformar em cliente mensal
              </p>
            </div>

            <Input
              placeholder="Buscar cliente por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4 !bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
            />

            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>
                    {availableClients.length === 0 
                      ? 'Todos os clientes já possuem planos mensais ativos'
                      : 'Nenhum cliente encontrado'
                    }
                  </p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <Card
                    key={client.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md !bg-zinc-900 border-zinc-800",
                      selectedClientId === client.id && "ring-2 ring-blue-500"
                    )}
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{client.name}</h4>
                          <p className="text-sm text-zinc-400">{client.phone}</p>
                          {client.email && (
                            <p className="text-xs text-zinc-500">{client.email}</p>
                          )}
                        </div>
                        {selectedClientId === client.id && (
                          <CheckCircle2 className="w-6 h-6 text-blue-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-white">
                <DollarSign className="w-5 h-5 text-green-500" />
                Escolha o Plano
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                Selecione o tipo de plano mensal para o cliente
              </p>
            </div>

            {selectedClient && (
              <Card className="!bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{selectedClient.name}</p>
                      <p className="text-sm text-zinc-400">{selectedClient.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {PLAN_TYPES.map((plan) => (
                <Card
                  key={plan.value}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:scale-105 !bg-zinc-900 border-zinc-800",
                    planType === plan.value && "ring-4 ring-primary shadow-xl"
                  )}
                  onClick={() => setPlanType(plan.value)}
                >
                  <CardContent className="p-8 text-center space-y-4">
                    <div className={cn(
                      "w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center text-5xl shadow-lg",
                      plan.gradient
                    )}>
                      {plan.icon}
                    </div>
                    <h4 className="font-bold text-2xl text-white">{plan.label}</h4>
                    <p className="text-base text-zinc-400">{plan.description}</p>
                    <div className="pt-4">
                      <div className="text-4xl font-bold text-green-500">
                        R$ {plan.price}
                      </div>
                      <p className="text-sm text-zinc-500">por mês</p>
                    </div>
                    {planType === plan.value && (
                      <Badge className="mt-2 bg-green-500 text-base py-1 px-4">
                        ✓ Selecionado
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {planType && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-zinc-200">Preço Personalizado (opcional)</Label>
                  <Input
                    type="number"
                    placeholder={`Padrão: R$ ${selectedPlan?.price}`}
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    step="0.01"
                    className="!bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                  />
                  <p className="text-xs text-zinc-500">
                    Deixe em branco para usar o valor padrão do plano
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-zinc-200">Data de Início do Plano</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="!bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-blue-500" />
                Agendamentos do Mês
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                Selecione as datas específicas para este mês
              </p>
            </div>

            {selectedPlan && (
              <Card className="!bg-blue-950/30 border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-200">
                        Plano {selectedPlan.label}
                      </p>
                      <p className="text-blue-300">
                        Selecione {selectedPlan.minSchedules === selectedPlan.maxSchedules
                          ? `${selectedPlan.minSchedules} data(s) específica(s)`
                          : `de ${selectedPlan.minSchedules} a ${selectedPlan.maxSchedules} datas`
                        } no calendário
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <MonthlySchedulePicker
              maxSchedules={selectedPlan?.maxSchedules || 4}
              selectedSchedules={schedules}
              onSchedulesChange={setSchedules}
              currentClientId={selectedClientId}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-white">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Revisão Final
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                Revise as informações antes de confirmar
              </p>
            </div>

            <Card className="!bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                  <UserCheck className="w-4 h-4" />
                  Cliente
                </h4>
                <div className="space-y-1">
                  <p className="font-medium text-white">{selectedClient?.name}</p>
                  <p className="text-sm text-zinc-400">{selectedClient?.phone}</p>
                  {selectedClient?.email && (
                    <p className="text-sm text-zinc-400">{selectedClient?.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="!bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                  <DollarSign className="w-4 h-4" />
                  Plano e Pagamento
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Plano:</span>
                    <Badge className={selectedPlan?.color}>
                      {selectedPlan?.icon} {selectedPlan?.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Valor Mensal:</span>
                    <span className="font-bold text-green-500">
                      R$ {(customPrice ? parseFloat(customPrice) : selectedPlan?.price)?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Data de Início:</span>
                    <span className="font-medium text-white">
                      {new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="!bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                  <Calendar className="w-4 w-4" />
                  Agendamentos ({schedules.length})
                </h4>
                <div className="space-y-2">
                  {schedules
                    .sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime())
                    .map((schedule, idx) => {
                      const [year, month, day] = schedule.date.split('-').map(Number);
                      const scheduleDate = new Date(year, month - 1, day);
                      const dayOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][scheduleDate.getDay()];
                      const formattedDate = scheduleDate.toLocaleDateString('pt-BR');
                      
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 !bg-zinc-800/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-blue-400">{dayOfWeek}</span>
                            <span className="text-zinc-500">•</span>
                            <span className="font-semibold text-white">{formattedDate}</span>
                            <span className="text-zinc-500">•</span>
                            <span className="font-mono font-semibold text-lg text-white">{schedule.time}</span>
                          </div>
                          <span className="text-sm text-zinc-400">{schedule.serviceType}</span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-200">Observações (opcional)</Label>
              <Textarea
                placeholder="Adicione observações sobre este cliente mensal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="!bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-zinc-800">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="w-full sm:w-auto text-sm"
              disabled={isSubmitting}
            >
              Voltar
            </Button>
          )}
          
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
              className="w-full sm:w-auto text-sm"
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-sm bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar e Criar Plano
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}