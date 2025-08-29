// components/appointments/Timer.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const { updateAppointment } = useAppStore();
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    timeElapsed: 0,
    isCompleted: false
  });

  const targetTimeInSeconds = serviceDuration * 60;

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

          // Auto-complete appointment when timer reaches target
          if (newCompleted && !prev.isCompleted) {
            updateAppointment(appointment.id, { status: 'in_progress' });
          }

          return newState;
        });
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [timer.isRunning, timer.isCompleted, appointment.id, targetTimeInSeconds, updateAppointment]);

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
    
    // Update appointment status to in_progress
    updateAppointment(appointment.id, { status: 'in_progress' });
  }, [timer.timeElapsed, appointment.id, updateAppointment]);

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

  const completeService = useCallback(() => {
    const newState = {
      isRunning: false,
      timeElapsed: timer.timeElapsed,
      isCompleted: true
    };
    
    setTimer(newState);
    localStorage.setItem(`timer-${appointment.id}`, JSON.stringify(newState));
    updateAppointment(appointment.id, { status: 'completed', completed_at: new Date().toISOString() });
  }, [timer.timeElapsed, appointment.id, updateAppointment]);

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
        <div className="flex justify-center gap-2">
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

          {(timer.isCompleted || timer.timeElapsed >= targetTimeInSeconds * 0.8) && appointment.status !== 'completed' && (
            <Button 
              onClick={completeService}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Finalizar
            </Button>
          )}
        </div>

        {/* Service Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Duração estimada: {serviceDuration} minutos
        </div>
      </CardContent>
    </Card>
  );
}