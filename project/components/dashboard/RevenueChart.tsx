// @ts-nocheck
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils/currency';
import { useAppStore } from '@/lib/store';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';

export function RevenueChart() {
  const appointments = useAppStore((state) => state.appointments);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayRevenue = appointments
        .filter(appointment => 
          appointment.scheduled_date.startsWith(dateStr) &&
          appointment.status === 'completed'
        )
        .reduce((total, appointment) => total + appointment.price, 0);

      return {
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        revenue: dayRevenue,
        date: dateStr,
        fullDate: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      };
    });
  }, [appointments]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg shadow-xl border px-4 py-3 bg-card backdrop-blur-sm">
          <p className="font-semibold text-sm mb-1">
            {label} - {payload[0].payload.fullDate}
          </p>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Receita dos Últimos 7 Dias</CardTitle>
            <CardDescription className="mt-1.5">
              Acompanhe o desempenho diário da barbearia
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total do período</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(chartData.reduce((sum, d) => sum + d.revenue, 0))}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart 
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? '#444444' : '#e5e5e5'}
              vertical={false}
              strokeWidth={1}
            />
            <XAxis 
              dataKey="day"
              stroke={isDark ? '#888888' : '#666666'}
              tick={{ fill: isDark ? '#d4d4d4' : '#525252', fontSize: 13, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#444444' : '#d4d4d4' }}
              dy={8}
            />
            <YAxis 
              stroke={isDark ? '#888888' : '#666666'}
              tick={{ fill: isDark ? '#d4d4d4' : '#525252', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value)}
              width={80}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
            />
            <Bar 
              dataKey="revenue"
              fill="url(#barGradient)"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  opacity={entry.revenue === 0 ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}