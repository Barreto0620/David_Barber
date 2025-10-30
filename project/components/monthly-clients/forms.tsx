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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserCheck, 
  Calendar, 
  DollarSign, 
  Clock, 
  Plus, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

const PLAN_TYPES = [
  { 
    value: 'basic', 
    label: 'Básico', 
    price: 80, 
    description: '1 visita por semana',
    color: 'bg-blue-500',
    icon: '🔷'
  },
  { 
    value: 'premium', 
    label: 'Premium', 
    price: 150, 
    description: '2 visitas por semana',
    color: 'bg-purple-500',
    icon: '💎'
  },
  { 
    value: 'vip', 
    label: 'VIP', 
    price: 250, 
    description: '2 visitas + benefícios extras',
    color: 'bg-amber-500',
    icon: '👑'
  },
];

const SERVICE_TYPES = [
  'Corte Simples',
  'Corte + Barba',
  'Corte Premium',
  'Corte Premium + Barba',
  'Barba',
  'Sobrancelha',
  'Luzes',
  'Hidratação',
];

interface WeeklySchedule {
  id: string;
  dayOfWeek: number;
  time: string;
  serviceType: string;
}

interface AddMonthlyClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddMonthlyClientModal({ open, onClose, onSuccess }: AddMonthlyClientModalProps) {
  const { clients, addMonthlyClient, monthlyClients } = useAppStore();
  
  const [step, setStep] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [planType, setPlanType] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Limpar formulário ao fechar
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

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedPlan = PLAN_TYPES.find(p => p.value === planType);

  // Filtra clientes que NÃO são mensais ativos
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

  const addSchedule = () => {
    const newSchedule: WeeklySchedule = {
      id: Math.random().toString(36).substr(2, 9),
      dayOfWeek: 1,
      time: '09:00',
      serviceType: SERVICE_TYPES[0],
    };
    setSchedules([...schedules, newSchedule]);
  };

  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const updateSchedule = (id: string, field: keyof WeeklySchedule, value: any) => {
    setSchedules(schedules.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const canProceedStep1 = selectedClientId !== '';
  const canProceedStep2 = planType !== '';
  const canProceedStep3 = schedules.length > 0 && schedules.every(s => 
    s.dayOfWeek !== null && s.time !== '' && s.serviceType !== ''
  );

  const handleSubmit = async () => {
    if (!selectedClient || !selectedPlan) return;

    setIsSubmitting(true);

    try {
      const finalPrice = customPrice ? parseFloat(customPrice) : selectedPlan.price;

      const result = await addMonthlyClient({
        clientId: selectedClient.id,
        planType: planType as 'basic' | 'premium' | 'vip',
        monthlyPrice: finalPrice,
        startDate: startDate,
        schedules: schedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          time: s.time,
          serviceType: s.serviceType
        })),
        notes: notes || undefined
      });

      if (result) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao criar plano mensal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinSchedules = () => {
    if (planType === 'basic') return 1;
    if (planType === 'premium') return 2;
    if (planType === 'vip') return 2;
    return 1;
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

        {/* STEP 1: Selecionar Cliente */}
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

            <div className="relative">
              <Input
                placeholder="Buscar cliente por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
            </div>

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

        {/* STEP 2: Escolher Plano */}
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

            <div className="grid gap-4 md:grid-cols-3">
              {PLAN_TYPES.map((plan) => (
                <Card
                  key={plan.value}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    planType === plan.value && "ring-2 ring-primary"
                  )}
                  onClick={() => setPlanType(plan.value)}
                >
                  <CardContent className="p-6 text-center space-y-2">
                    <div className="text-4xl mb-2">{plan.icon}</div>
                    <h4 className="font-bold text-lg">{plan.label}</h4>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <div className="pt-4">
                      <div className="text-3xl font-bold text-green-600">
                        R$ {plan.price}
                      </div>
                      <p className="text-xs text-muted-foreground">por mês</p>
                    </div>
                    {planType === plan.value && (
                      <Badge className="mt-2">Selecionado</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {planType && (
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
            )}

            <div className="space-y-2">
              <Label>Data de Início do Plano</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Configurar Agendamentos */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Agendamentos Semanais
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure os horários fixos semanais do cliente
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
                        Mínimo de {getMinSchedules()} agendamento(s) semanal(is)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {schedules.map((schedule, index) => (
                <Card key={schedule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <h4 className="font-medium">Agendamento {index + 1}</h4>
                      {schedules.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          onClick={() => removeSchedule(schedule.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Dia da Semana</Label>
                        <Select
                          value={schedule.dayOfWeek.toString()}
                          onValueChange={(v) => updateSchedule(schedule.id, 'dayOfWeek', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day.value} value={day.value.toString()}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Horário</Label>
                        <Input
                          type="time"
                          value={schedule.time}
                          onChange={(e) => updateSchedule(schedule.id, 'time', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Serviço</Label>
                        <Select
                          value={schedule.serviceType}
                          onValueChange={(v) => updateSchedule(schedule.id, 'serviceType', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_TYPES.map((service) => (
                              <SelectItem key={service} value={service}>
                                {service}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={addSchedule}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Outro Horário
            </Button>
          </div>
        )}

        {/* STEP 4: Revisão e Observações */}
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

            {/* Cliente */}
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

            {/* Plano */}
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
                      {new Date(startDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agendamentos */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Agendamentos Semanais ({schedules.length})
                </h4>
                <div className="space-y-2">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {DAYS_OF_WEEK[schedule.dayOfWeek].label}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{schedule.time}</p>
                        <p className="text-xs text-muted-foreground">{schedule.serviceType}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
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