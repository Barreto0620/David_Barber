// components/appointments/Timer.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Square, Clock, CheckCircle, FileText, AlertCircle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
// Adicione a função completeAppointment aqui
import { useAppStore } from '@/lib/store'; 
import type { Appointment } from '@/types/database';

interface TimerProps {
  appointment: Appointment;
  serviceDuration: number; // in minutes
}

interface TimerState {
  isRunning: boolean;
  timeElapsed: number; // in seconds
  isCompleted: boolean;
  startTime?: Date;
}

export function Timer({ appointment, serviceDuration }: TimerProps) {
  // Substitua 'updateAppointment' por 'completeAppointment'
  const { completeAppointment } = useAppStore(); 
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    timeElapsed: 0,
    isCompleted: false
  });
  
  const [completionNotes, setCompletionNotes] = useState('');
  const [finalValue, setFinalValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const targetTimeInSeconds = serviceDuration * 60;

  // Função para obter o valor original do serviço
  const getOriginalValue = () => {
    // Aqui você pode definir os valores dos serviços ou buscar de uma base de dados
    const serviceValues: Record<string, number> = {
      'Corte': 25.00,
      'Barba': 15.00,
      'Sobrancelha': 10.00,
      'Corte + Barba': 35.00,
      'Corte + Sobrancelha': 30.00,
      'Corte + Barba + Sobrancelha': 45.00,
      'Barba + Sobrancelha': 20.00,
    };
    
    return serviceValues[appointment.service_type] || 0;
  };

  // Load saved timer state from localStorage
  useEffect(() => {
    const savedTimer = localStorage.getItem(`timer-${appointment.id}`);
    if (savedTimer) {
      const parsed = JSON.parse(savedTimer);
      if (parsed.startTime && parsed.isRunning) {
        const now = new Date();
        const startTime = new Date(parsed.startTime);
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        setTimer({
          isRunning: true,
          timeElapsed: elapsed,
          isCompleted: elapsed >= targetTimeInSeconds,
          startTime
        });
      } else {
        setTimer(parsed);
      }
    }
  }, [appointment.id, targetTimeInSeconds]);

  // Timer tick effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (timer.isRunning && !timer.isCompleted) {
      intervalId = setInterval(() => {
        setTimer(prev => {
          const newElapsed = prev.timeElapsed + 1;
          const newCompleted = newElapsed >= targetTimeInSeconds;
          
          const newState = {
            ...prev,
            timeElapsed: newElapsed,
            isCompleted: newCompleted
          };

          // Save to localStorage
          localStorage.setItem(`timer-${appointment.id}`, JSON.stringify(newState));

          return newState;
        });
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [timer.isRunning, timer.isCompleted, appointment.id, targetTimeInSeconds]);

  const startTimer = useCallback(() => {
    const startTime = new Date();
    const newState = {
      isRunning: true,
      timeElapsed: timer.timeElapsed,
      isCompleted: false,
      startTime
    };
    
    setTimer(newState);
    localStorage.setItem(`timer-${appointment.id}`, JSON.stringify(newState));
  }, [timer.timeElapsed, appointment.id]);

  const pauseTimer = useCallback(() => {
    const newState = { ...timer, isRunning: false };
    setTimer(newState);
    localStorage.setItem(`timer-${appointment.id}`, JSON.stringify(newState));
  }, [timer, appointment.id]);

  const stopTimer = useCallback(() => {
    const newState = {
      isRunning: false,
      timeElapsed: 0,
      isCompleted: false
    };
    
    setTimer(newState);
    localStorage.removeItem(`timer-${appointment.id}`);
  }, [appointment.id]);

  const completeService = useCallback(async () => {
    setIsCompleting(true);
    
    try {
      // Valor final, usa o valor digitado ou o valor original se o campo estiver vazio
      const finalPrice = finalValue ? parseFloat(finalValue.replace(',', '.')) : getOriginalValue();
      
      // Chame a função completa da store
      await completeAppointment(
        appointment.id, 
        paymentMethod, 
        finalPrice,
        completionNotes.trim()
      );

      // Clean up timer state
      const finalState = {
        isRunning: false,
        timeElapsed: timer.timeElapsed,
        isCompleted: true
      };
      
      setTimer(finalState);
      localStorage.setItem(`timer-${appointment.id}`, JSON.stringify(finalState));
      setShowCompletionDialog(false);
      
      // Reset form
      setCompletionNotes('');
      setFinalValue('');
      setPaymentMethod('');
      
    } catch (error) {
      console.error('Erro ao finalizar serviço:', error);
    } finally {
      setIsCompleting(false);
    }
  }, [timer.timeElapsed, appointment.id, completeAppointment, completionNotes, finalValue, paymentMethod]); // Corrigido a dependência para completeAppointment

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return Math.min((timer.timeElapsed / targetTimeInSeconds) * 100, 100);
  };

  const getRemainingTime = () => {
    const remaining = Math.max(targetTimeInSeconds - timer.timeElapsed, 0);
    return formatTime(remaining);
  };

  const getTimerColor = () => {
    const progress = getProgressPercentage();
    if (progress >= 100) return 'text-green-600 dark:text-green-400';
    if (progress >= 80) return 'text-orange-600 dark:text-orange-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const canComplete = () => {
    // Altera a lógica para que o botão de finalização apareça sempre que o status do agendamento não for "concluído".
    return appointment.status !== 'completed';
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const handleFinalValueChange = (value: string) => {
    // Permitir apenas números e vírgula/ponto
    const cleaned = value.replace(/[^\d,.]/g, '');
    setFinalValue(cleaned);
  };

  if (appointment.status === 'completed') {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Serviço Concluído
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Tempo total: {formatTime(timer.timeElapsed)}
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Finalizado
            </Badge>
          </div>
          {appointment.notes && (
            <div className="text-sm mt-2">
              <Label className="text-xs font-medium text-muted-foreground">Observações:</Label>
              <p className="text-sm mt-1 p-2 bg-muted rounded-md">{appointment.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Cronômetro - {appointment.service_type}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div className={cn("text-4xl font-mono font-bold", getTimerColor())}>
            {formatTime(timer.timeElapsed)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Tempo restante: {getRemainingTime()}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-secondary rounded-full h-2 mt-3">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-1000 ease-out",
                getProgressPercentage() >= 100 
                  ? "bg-green-500" 
                  : getProgressPercentage() >= 80 
                  ? "bg-orange-500" 
                  : "bg-blue-500"
              )}
              style={{ width: `${Math.min(getProgressPercentage(), 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {getProgressPercentage().toFixed(1)}% concluído
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          {timer.isCompleted ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Tempo Concluído
            </Badge>
          ) : timer.isRunning ? (
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Play className="h-3 w-3 mr-1" />
              Em Andamento
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Pause className="h-3 w-3 mr-1" />
              Pausado
            </Badge>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2 flex-wrap">
          {!timer.isRunning && !timer.isCompleted && (
            <Button 
              onClick={startTimer}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="h-4 w-4 mr-1" />
              {timer.timeElapsed > 0 ? 'Continuar' : 'Iniciar'}
            </Button>
          )}

          {timer.isRunning && (
            <Button 
              onClick={pauseTimer}
              variant="outline"
              size="sm"
            >
              <Pause className="h-4 w-4 mr-1" />
              Pausar
            </Button>
          )}

          {timer.timeElapsed > 0 && (
            <Button 
              onClick={stopTimer}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
            >
              <Square className="h-4 w-4 mr-1" />
              Parar
            </Button>
          )}

          {canComplete() && (
            <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Finalizar Atendimento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Finalizar Atendimento
                  </DialogTitle>
                  <DialogDescription>
                    Confirme os detalhes do serviço realizado para {appointment.customer_name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Serviço */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Serviço</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-medium text-sm">{appointment.service_type}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Valor original: {formatCurrency(getOriginalValue())}
                      </div>
                    </div>
                  </div>

                  {/* Valor Final */}
                  <div>
                    <Label htmlFor="final-value" className="text-sm font-medium">
                      Valor Final (opcional)
                    </Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="final-value"
                        type="text"
                        placeholder={getOriginalValue().toFixed(2).replace('.', ',')}
                        value={finalValue}
                        onChange={(e) => handleFinalValueChange(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Deixe em branco para usar o valor original
                    </p>
                  </div>

                  {/* Forma de Pagamento */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Forma de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Observações */}
                  <div>
                    <Label htmlFor="completion-notes" className="text-sm font-medium">
                      Observações (opcional)
                    </Label>
                    <Textarea
                      id="completion-notes"
                      placeholder="Adicione observações sobre o atendimento..."
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCompletionDialog(false);
                      setCompletionNotes('');
                      setFinalValue('');
                      setPaymentMethod('');
                    }}
                    disabled={isCompleting}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={completeService}
                    disabled={isCompleting || !paymentMethod}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isCompleting ? (
                      <>
                        <Clock className="h-4 w-4 mr-1 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Finalizar Atendimento
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Service Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Duração estimada: {serviceDuration} minutos
          {timer.timeElapsed > 0 && (
            <span className="block mt-1">
              Tempo decorrido: {Math.round(timer.timeElapsed / 60)} min
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}