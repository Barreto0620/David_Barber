// @ts-nocheck
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  type?: 'currency' | 'number' | 'text';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  type = 'number', 
  trend = 'neutral', 
  trendValue,
  icon,
  className 
}: MetricCardProps) {
  const formatValue = () => {
    if (type === 'currency' && typeof value === 'number') {
      return formatCurrency(value);
    }
    return value.toString();
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-lg', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue()}
        </div>
        {trendValue && (
          <p className={cn('text-xs', getTrendColor())}>
            {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}