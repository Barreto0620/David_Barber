// @ts-nocheck
'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalendarProps = {
  mode?: 'single' | 'range';
  selected?: Date | { from?: Date; to?: Date };
  onSelect?: (date: Date | { from?: Date; to?: Date }) => void;
  className?: string;
  disabled?: (date: Date) => boolean;
  numberOfMonths?: number;
};

function Calendar({
  mode = 'single',
  selected,
  onSelect,
  className,
  disabled,
  numberOfMonths = 1,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [hoverDate, setHoverDate] = React.useState(null);
  const [showYearPicker, setShowYearPicker] = React.useState(false);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Gera lista de anos (20 anos para trás e 5 para frente)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 26 }, (_, i) => currentYear - 20 + i);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isInRange = (date) => {
    if (mode !== 'range' || !selected?.from || !date) return false;
    
    const compareDate = selected?.to || hoverDate;
    if (!compareDate) return false;
    
    const start = selected.from < compareDate ? selected.from : compareDate;
    const end = selected.from < compareDate ? compareDate : selected.from;
    
    return date >= start && date <= end;
  };

  const handleDateClick = (date) => {
    if (disabled && disabled(date)) return;

    if (mode === 'single') {
      onSelect?.(date);
    } else if (mode === 'range') {
      if (!selected?.from || (selected?.from && selected?.to)) {
        onSelect?.({ from: date, to: null });
      } else {
        if (date < selected.from) {
          onSelect?.({ from: date, to: selected.from });
        } else {
          onSelect?.({ from: selected.from, to: date });
        }
      }
    } else if (mode === 'multiple') {
      const selectedDates = Array.isArray(selected) ? selected : [];
      const isAlreadySelected = selectedDates.some(d => isSameDay(d, date));
      
      if (isAlreadySelected) {
        onSelect?.(selectedDates.filter(d => !isSameDay(d, date)));
      } else {
        onSelect?.([...selectedDates, date]);
      }
    }
  };

  const days = getDaysInMonth(currentMonth);

  const isSelected = (day) => {
    if (mode === 'single') {
      return isSameDay(day, selected);
    } else if (mode === 'range') {
      return isSameDay(day, selected?.from) || isSameDay(day, selected?.to);
    } else if (mode === 'multiple') {
      const selectedDates = Array.isArray(selected) ? selected : [];
      return selectedDates.some(d => isSameDay(d, day));
    }
    return false;
  };

  return (
    <div className={cn("bg-white rounded-2xl shadow-lg p-6", className)}>
      {/* Header do mês */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        
        <button
          onClick={() => setShowYearPicker(!showYearPicker)}
          className="text-lg font-semibold text-slate-800 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors"
        >
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </button>
        
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Seletor de ano */}
      {showYearPicker && (
        <div className="mb-4 p-4 bg-slate-50 rounded-xl max-h-64 overflow-y-auto">
          <div className="grid grid-cols-4 gap-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => {
                  setCurrentMonth(new Date(year, currentMonth.getMonth()));
                  setShowYearPicker(false);
                }}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  year === currentMonth.getFullYear()
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 hover:bg-blue-50"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Dias do mês */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} />;
          }

          const selected = isSelected(day);
          const inRange = isInRange(day);
          const isToday = isSameDay(day, new Date());
          const isDisabled = disabled && disabled(day);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              onMouseEnter={() => setHoverDate(day)}
              onMouseLeave={() => setHoverDate(null)}
              disabled={isDisabled}
              className={cn(
                "aspect-square rounded-lg text-sm font-medium transition-all relative",
                selected && "bg-blue-600 text-white shadow-md hover:bg-blue-700",
                !selected && inRange && "bg-blue-100 text-blue-900",
                !selected && !inRange && "text-slate-700 hover:bg-slate-100",
                isToday && !selected && "ring-2 ring-blue-400",
                isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };

// Componente com Popover e Shortcuts
export function CalendarWithPopover({
  mode = 'range',
  selected,
  onSelect,
  placeholder = 'Selecione o período',
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const shortcuts = [
    { label: 'Hoje', getValue: () => {
      const today = new Date();
      return mode === 'range' ? { from: today, to: today } : today;
    }},
    { label: 'Últimos 7 dias', getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 6);
      return { from, to };
    }},
    { label: 'Últimos 30 dias', getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 29);
      return { from, to };
    }},
    { label: 'Este mês', getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from, to };
    }},
    { label: 'Último mês', getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from, to };
    }}
  ];

  const formatDateRange = () => {
    if (mode === 'single' && selected) {
      return selected.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    
    if (mode === 'multiple' && Array.isArray(selected) && selected.length > 0) {
      if (selected.length === 1) {
        return selected[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return `${selected.length} dias selecionados`;
    }
    
    if (mode === 'range') {
      if (!selected?.from) return placeholder;
      
      const formatDate = (date) => {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      };
      
      if (!selected?.to) return formatDate(selected.from);
      return `${formatDate(selected.from)} - ${formatDate(selected.to)}`;
    }
    
    return placeholder;
  };

  const clearDates = () => {
    if (mode === 'multiple') {
      onSelect?.([]);
    } else {
      onSelect?.(mode === 'range' ? { from: null, to: null } : null);
    }
  };

  const handleShortcut = (shortcut) => {
    const value = shortcut.getValue();
    onSelect?.(value);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white rounded-xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition-shadow border border-slate-200"
      >
        <span className="text-slate-700 font-medium">{formatDateRange()}</span>
        {((mode === 'single' && selected) || (mode === 'range' && selected?.from) || (mode === 'multiple' && Array.isArray(selected) && selected.length > 0)) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearDates();
            }}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {mode === 'range' && (
              <div className="bg-slate-50 p-4 border-b md:border-b-0 md:border-r border-slate-200">
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Atalhos</h3>
                <div className="space-y-1">
                  {shortcuts.map((shortcut, index) => (
                    <button
                      key={index}
                      onClick={() => handleShortcut(shortcut)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-white hover:text-blue-600 rounded-lg transition-colors"
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4">
              <Calendar
                mode={mode}
                selected={selected}
                onSelect={onSelect}
              />
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={clearDates}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}