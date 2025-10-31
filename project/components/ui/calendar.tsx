// @ts-nocheck
'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: CalendarProps) {
  return (
    <div className="relative group light" data-theme="light">
      {/* Glow effect sutil */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="light" style={{ colorScheme: 'light' }}>
        <DayPicker
          showOutsideDays={showOutsideDays}
          locale={ptBR}
          className={cn(
            'p-6 rounded-2xl relative',
            'bg-white',
            'border border-slate-200',
            'shadow-sm',
            className
          )}
          style={{
            backgroundColor: '#ffffff',
            color: '#0f172a'
          }}
          classNames={{
            months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center mb-4',
            caption_label: 'text-base font-semibold capitalize',
            nav: 'flex items-center gap-1',
            nav_button: cn(
              'h-9 w-9 p-0 rounded-lg transition-all duration-100',
              'bg-transparent hover:bg-slate-100',
              'border border-transparent hover:border-slate-200'
            ),
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse space-y-1',
            head_row: 'flex gap-1',
            head_cell: 'w-9 font-medium text-xs uppercase tracking-wider',
            row: 'flex w-full mt-1 gap-1',
            cell: 'relative text-center text-sm focus-within:relative',
            day: cn(
              'h-9 w-9 p-0 font-medium rounded-lg transition-all duration-100',
              'hover:bg-slate-100',
              'focus:outline-none',
              'cursor-pointer'
            ),
            day_range_end: 'day-range-end',
            day_selected: 'bg-slate-200 text-slate-900 font-semibold hover:bg-slate-300',
            day_today: cn(
              'bg-blue-50',
              'text-blue-600 font-semibold',
              'ring-1 ring-blue-300'
            ),
            day_outside: 'invisible',
            day_disabled: 'opacity-50 cursor-not-allowed hover:bg-transparent',
            day_range_middle: 'aria-selected:bg-slate-100 aria-selected:text-slate-900',
            day_hidden: 'invisible',
            ...classNames,
          }}
          modifiersStyles={{
            selected: {
              backgroundColor: '#e2e8f0',
              color: '#0f172a',
              fontWeight: '600'
            }
          }}
          styles={{
            root: { backgroundColor: '#ffffff' },
            caption_label: { color: '#0f172a' },
            head_cell: { color: '#475569' },
            day: { color: '#0f172a' },
            nav_button: { color: '#475569' },
          }}
          components={{
            IconLeft: ({ ...props }) => (
              <ChevronLeft className="h-4 w-4" style={{ color: '#475569' }} />
            ),
            IconRight: ({ ...props }) => (
              <ChevronRight className="h-4 w-4" style={{ color: '#475569' }} />
            ),
          }}
          {...props}
        />
      </div>
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };