'use client';

import { useState } from 'react';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { ServiceCompletionModal } from '@/components/appointments/ServiceCompletionModal';
import { NewAppointmentModal } from '@/components/forms/NewAppointmentModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Plus, Filter, Scissors, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getAppointmentsByDate, getAppointmentsByStatus } from '@/lib/utils/appointments';
import type { Appointment, PaymentMethod, AppointmentStatus } from '@/types/database';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/currency';

export default function AppointmentsPage() {
  const { 
    appointments, 
    selectedDate, 
    setSelectedDate,
    completeAppointment,
    cancelAppointment 
  } = useAppStore();

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [newAppointmentModalOpen, setNewAppointmentModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'daily' | 'all'>('daily');

  // Lógica para definir a lista de agendamentos a ser exibida
  const displayAppointments = viewMode === 'all' 
    ? appointments 
    : getAppointmentsByDate(appointments, selectedDate);
    
  // Filtra os agendamentos com base na aba e no modo de visualização
  const filteredAppointments = activeTab === 'all' 
    ? displayAppointments 
    : getAppointmentsByStatus(displayAppointments, activeTab);

  const getStatusCount = (status: AppointmentStatus) => {
    return getAppointmentsByStatus(displayAppointments, status).length;
  };

  const handleCompleteAppointment = (id: string) => {
    const appointment = appointments.find(apt => apt.id === id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setCompletionModalOpen(true);
    }
  };

  const handleServiceCompletion = (paymentMethod: PaymentMethod, finalPrice: number, notes?: string) => {
    if (!selectedAppointment) return;
    
    completeAppointment(selectedAppointment.id, paymentMethod, finalPrice);
    toast.success('Atendimento finalizado com sucesso!');
    
    setSelectedAppointment(null);
    setCompletionModalOpen(false);
  };

  const handleCancelAppointment = (id: string) => {
    setAppointmentToCancel(id);
    setCancelDialogOpen(true);
  };

  const confirmCancelAppointment = () => {
    if (appointmentToCancel) {
      cancelAppointment(appointmentToCancel);
      toast.success('Agendamento cancelado com sucesso!');
      setAppointmentToCancel(null);
      setCancelDialogOpen(false);
    }
  };

  const getCancelAppointmentDetails = () => {
    if (!appointmentToCancel) return null;
    return appointments.find(apt => apt.id === appointmentToCancel);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie todos os agendamentos da barbearia
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button onClick={() => setNewAppointmentModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Date and View Mode Selection */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span className="text-base sm:text-lg">
                {viewMode === 'daily' ? 'Data Selecionada' : 'Visualização Completa'}
              </span>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {viewMode === 'daily' ? formatDate(selectedDate) : 'Todos os Agendamentos'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              onClick={() => setViewMode('daily')}
              className="w-full sm:w-auto"
            >
              Visualização Diária
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setViewMode('all')}
              className="w-full sm:w-auto"
            >
              Visualização Completa
            </Button>
          </div>
          {viewMode === 'daily' && (
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  const yesterday = new Date(selectedDate);
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday);
                }}
                className="w-full sm:w-auto"
              >
                Dia Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
                className="w-full sm:w-auto"
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const tomorrow = new Date(selectedDate);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow);
                }}
                className="w-full sm:w-auto"
              >
                Próximo Dia
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AppointmentStatus | 'all')}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Todos</span>
            <span className="sm:hidden">Todos</span>
            <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
              {displayAppointments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Agendados</span>
            <span className="sm:hidden">Agend.</span>
            <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
              {getStatusCount('scheduled')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Em Andamento</span>
            <span className="sm:hidden">Ativo</span>
            <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
              {getStatusCount('in_progress')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Concluídos</span>
            <span className="sm:hidden">Concl.</span>
            <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
              {getStatusCount('completed')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Cancelados</span>
            <span className="sm:hidden">Canc.</span>
            <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
              {getStatusCount('cancelled')}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8">
                <p className="text-center text-sm sm:text-base text-muted-foreground">
                  Nenhum agendamento encontrado para esta {viewMode === 'daily' ? 'data' : 'visualização'}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onComplete={handleCompleteAppointment}
                  onCancel={handleCancelAppointment}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="max-w-md mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <AlertDialogTitle className="text-center text-xl sm:text-2xl">
              Cancelar Agendamento?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3 pt-2">
              <div className="flex items-center justify-center gap-2 text-base font-medium text-foreground">
                <Scissors className="w-4 h-4" />
                <span>Confirme o cancelamento</span>
              </div>
              {getCancelAppointmentDetails() && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium text-foreground">
                      {getCancelAppointmentDetails()?.clientName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviço:</span>
                    <span className="font-medium text-foreground">
                      {getCancelAppointmentDetails()?.serviceName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário:</span>
                    <span className="font-medium text-foreground">
                      {getCancelAppointmentDetails()?.time}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground pt-2">
                Esta ação não poderá ser desfeita. O agendamento será marcado como cancelado.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto mt-0">
              Manter Agendamento
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelAppointment}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Sim, Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      <ServiceCompletionModal
        appointment={selectedAppointment}
        open={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        onComplete={handleServiceCompletion}
      />

      <NewAppointmentModal
        open={newAppointmentModalOpen}
        onClose={() => setNewAppointmentModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}