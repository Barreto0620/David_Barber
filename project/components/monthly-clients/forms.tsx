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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Adicionar Cliente Mensal
          </DialogTitle>
          <DialogDescription>
            Transforme um cliente em assinante mensal com agendamentos recorrentes
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Selecione o Cliente
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Escolha um cliente existente para transformar em cliente mensal
              </p>
            </div>

            <Input
              placeholder="Buscar cliente por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />

            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
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
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedClientId === client.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{client.name}</h4>
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                          {client.email && (
                            <p className="text-xs text-muted-foreground">{client.email}</p>
                          )}
                        </div>
                        {selectedClientId === client.id && (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
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
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Escolha o Plano
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione o tipo de plano mensal para o cliente
              </p>
            </div>

            {selectedClient && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedClient.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
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
                    "cursor-pointer transition-all hover:shadow-lg hover:scale-105",
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
                    <h4 className="font-bold text-2xl">{plan.label}</h4>
                    <p className="text-base text-muted-foreground">{plan.description}</p>
                    <div className="pt-4">
                      <div className="text-4xl font-bold text-green-600">
                        R$ {plan.price}
                      </div>
                      <p className="text-sm text-muted-foreground">por mês</p>
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
                  <Label>Preço Personalizado (opcional)</Label>
                  <Input
                    type="number"
                    placeholder={`Padrão: R$ ${selectedPlan?.price}`}
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para usar o valor padrão do plano
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Data de Início do Plano</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Agendamentos do Mês
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione as datas específicas para este mês
              </p>
            </div>

            {selectedPlan && (
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Plano {selectedPlan.label}
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
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
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Revisão Final
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Revise as informações antes de confirmar
              </p>
            </div>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Cliente
                </h4>
                <div className="space-y-1">
                  <p className="font-medium">{selectedClient?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedClient?.phone}</p>
                  {selectedClient?.email && (
                    <p className="text-sm text-muted-foreground">{selectedClient?.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Plano e Pagamento
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plano:</span>
                    <Badge className={selectedPlan?.color}>
                      {selectedPlan?.icon} {selectedPlan?.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Mensal:</span>
                    <span className="font-bold text-green-600">
                      R$ {(customPrice ? parseFloat(customPrice) : selectedPlan?.price)?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data de Início:</span>
                    <span className="font-medium">
                      {new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
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
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-primary">{dayOfWeek}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-semibold">{formattedDate}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-mono font-semibold text-lg">{schedule.time}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{schedule.serviceType}</span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                placeholder="Adicione observações sobre este cliente mensal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="w-full sm:w-auto"
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
              className="w-full sm:w-auto"
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
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