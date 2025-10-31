// @ts-nocheck
// components/appointments/AppointmentFilters.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon, 
  Users, 
  Scissors,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/currency';
import { useAppStore } from '@/lib/store';
import type { AppointmentStatus } from '@/types/database';

interface AppointmentFiltersProps {
  onFiltersChange: (filters: AppointmentFilters) => void;
  activeFilters: AppointmentFilters;
}

export interface AppointmentFilters {
  status: AppointmentStatus | 'all';
  service: string | 'all';
  client: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  priceMin: string;
  priceMax: string;
}

const statusOptions = [
  { value: 'all', label: 'Todos os status', color: 'bg-gray-100 text-gray-800' },
  { value: 'scheduled', label: 'Agendado', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'Em andamento', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
];

export function AppointmentFilters({ onFiltersChange, activeFilters }: AppointmentFiltersProps) {
  const { services, clients } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const updateFilters = (updates: Partial<AppointmentFilters>) => {
    const newFilters = { ...activeFilters, ...updates };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: AppointmentFilters = {
      status: 'all',
      service: 'all',
      client: '',
      dateFrom: null,
      dateTo: null,
      priceMin: '',
      priceMax: ''
    };
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.status !== 'all') count++;
    if (activeFilters.service !== 'all') count++;
    if (activeFilters.client) count++;
    if (activeFilters.dateFrom || activeFilters.dateTo) count++;
    if (activeFilters.priceMin || activeFilters.priceMax) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const getFilterSummary = () => {
    const summary = [];
    
    if (activeFilters.status !== 'all') {
      const statusOption = statusOptions.find(s => s.value === activeFilters.status);
      if (statusOption) summary.push(statusOption.label);
    }
    
    if (activeFilters.service !== 'all') {
      const service = services.find(s => s.id === activeFilters.service);
      if (service) summary.push(service.name);
    }
    
    if (activeFilters.client) {
      summary.push(`Cliente: ${activeFilters.client}`);
    }
    
    if (activeFilters.dateFrom || activeFilters.dateTo) {
      if (activeFilters.dateFrom && activeFilters.dateTo) {
        summary.push(`${formatDate(activeFilters.dateFrom)} - ${formatDate(activeFilters.dateTo)}`);
      } else if (activeFilters.dateFrom) {
        summary.push(`A partir de ${formatDate(activeFilters.dateFrom)}`);
      } else if (activeFilters.dateTo) {
        summary.push(`Até ${formatDate(activeFilters.dateTo)}`);
      }
    }
    
    if (activeFilters.priceMin || activeFilters.priceMax) {
      if (activeFilters.priceMin && activeFilters.priceMax) {
        summary.push(`R$ ${activeFilters.priceMin} - R$ ${activeFilters.priceMax}`);
      } else if (activeFilters.priceMin) {
        summary.push(`Acima de R$ ${activeFilters.priceMin}`);
      } else if (activeFilters.priceMax) {
        summary.push(`Até R$ ${activeFilters.priceMax}`);
      }
    }
    
    return summary;
  };

  return (
    <div className="space-y-4">
      {/* Filter Button and Summary */}
      <div className="flex items-center justify-between">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="start">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filtros</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Status
                  </Label>
                  <Select
                    value={activeFilters.status}
                    onValueChange={(value) => updateFilters({ status: value as AppointmentStatus | 'all' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            <div className={cn("w-3 h-3 rounded-full mr-2", option.color)} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">
                    <Scissors className="h-4 w-4 mr-2" />
                    Serviço
                  </Label>
                  <Select
                    value={activeFilters.service}
                    onValueChange={(value) => updateFilters({ service: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os serviços</SelectItem>
                      {services.filter(s => s.active).map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Client Filter */}
                <div className="space-y-2">
                  <Label htmlFor="client-filter" className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Cliente
                  </Label>
                  <Input
                    id="client-filter"
                    placeholder="Buscar por nome..."
                    value={activeFilters.client}
                    onChange={(e) => updateFilters({ client: e.target.value })}
                  />
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Período
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          {activeFilters.dateFrom ? formatDate(activeFilters.dateFrom) : "Data inicial"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={activeFilters.dateFrom || undefined}
                          onSelect={(date) => updateFilters({ dateFrom: date || null })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          {activeFilters.dateTo ? formatDate(activeFilters.dateTo) : "Data final"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={activeFilters.dateTo || undefined}
                          onSelect={(date) => updateFilters({ dateTo: date || null })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Faixa de Preço (R$)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Mínimo"
                      type="number"
                      min="0"
                      step="0.01"
                      value={activeFilters.priceMin}
                      onChange={(e) => updateFilters({ priceMin: e.target.value })}
                    />
                    <Input
                      placeholder="Máximo"
                      type="number"
                      min="0"
                      step="0.01"
                      value={activeFilters.priceMax}
                      onChange={(e) => updateFilters({ priceMax: e.target.value })}
                    />
                  </div>
                </div>

                {/* Apply Button */}
                <Button 
                  onClick={() => setIsOpen(false)} 
                  className="w-full"
                >
                  Aplicar Filtros
                </Button>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="flex-1 ml-4">
            <div className="flex flex-wrap gap-2">
              {getFilterSummary().map((filter, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {filter}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}