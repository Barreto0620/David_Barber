'use client';

import { useState } from 'react';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { ServiceCompletionModal } from '@/components/appointments/ServiceCompletionModal';
import { NewAppointmentModal } from '@/components/forms/NewAppointmentModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Filter } from 'lucide-react';
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
    completeAppointment 
  } = useAppStore();

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [newAppointmentModalOpen, setNewAppointmentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'daily' | 'all'>('daily'); // Novo estado para o modo de visualização

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
    toast.info('Agendamento cancelado');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os agendamentos da barbearia
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button onClick={() => setNewAppointmentModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Date and View Mode Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{viewMode === 'daily' ? 'Data Selecionada' : 'Visualização Completa'}</span>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {viewMode === 'daily' ? formatDate(selectedDate) : 'Todos os Agendamentos'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {/* Botões para o modo de visualização diária */}
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              onClick={() => setViewMode('daily')}
            >
              Visualização Diária
            </Button>
            {/* Botão para o modo de visualização completa */}
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setViewMode('all')}
            >
              Visualização Completa
            </Button>
          </div>
          {/* Mostra os botões de navegação de data apenas no modo 'daily' */}
          {viewMode === 'daily' && (
            <div className="flex items-center space-x-4 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  const yesterday = new Date(selectedDate);
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday);
                }}
              >
                Dia Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
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
              >
                Próximo Dia
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AppointmentStatus | 'all')}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Todos
            <Badge variant="secondary" className="ml-2">
              {displayAppointments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Agendados
            <Badge variant="secondary" className="ml-2">
              {getStatusCount('scheduled')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Em Andamento
            <Badge variant="secondary" className="ml-2">
              {getStatusCount('in_progress')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídos
            <Badge variant="secondary" className="ml-2">
              {getStatusCount('completed')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelados
            <Badge variant="secondary" className="ml-2">
              {getStatusCount('cancelled')}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <p className="text-center text-muted-foreground">
                  Nenhum agendamento encontrado para esta {viewMode === 'daily' ? 'data' : 'visualização'}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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