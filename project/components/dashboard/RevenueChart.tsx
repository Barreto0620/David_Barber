'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/currency';
import { useAppStore } from '@/lib/store';
import { useMemo } from 'react';

export function RevenueChart() {
  const appointments = useAppStore((state) => state.appointments);

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
      };
    });
  }, [appointments]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Receita dos Últimos 7 Dias</CardTitle>
        <CardDescription>
          Acompanhe o desempenho diário da barbearia
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
              labelFormatter={(label) => `Dia: ${label}`}
            />
            <Bar 
              dataKey="revenue" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
              className="fill-primary"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}