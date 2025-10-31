// @ts-nocheck
// components/ui/search-bar.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, User, Calendar, DollarSign } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDateTime } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SearchResult {
  id: string;
  type: 'client' | 'appointment';
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
}

export function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const { clients, appointments } = useAppStore();

  const search = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const normalizedQuery = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Search clients
    clients.forEach(client => {
      const normalizedName = client.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedPhone = client.phone.replace(/\D/g, '');
      
      if (
        normalizedName.includes(normalizedQuery) ||
        client.phone.includes(searchQuery) ||
        normalizedPhone.includes(searchQuery.replace(/\D/g, ''))
      ) {
        searchResults.push({
          id: client.id,
          type: 'client',
          title: client.name,
          subtitle: `${client.phone} • ${client.total_visits} visitas • ${formatCurrency(client.total_spent)}`,
          href: `/clients?id=${client.id}`,
          icon: <User className="h-4 w-4" />
        });
      }
    });

    // Search appointments
    appointments.forEach(appointment => {
      const client = clients.find(c => c.id === appointment.client_id);
      const clientName = client?.name || 'Cliente não encontrado';
      const normalizedClientName = clientName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedService = appointment.service_type.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (
        normalizedClientName.includes(normalizedQuery) ||
        normalizedService.includes(normalizedQuery) ||
        appointment.status.includes(normalizedQuery)
      ) {
        searchResults.push({
          id: appointment.id,
          type: 'appointment',
          title: `${clientName} - ${appointment.service_type}`,
          subtitle: `${formatDateTime(appointment.scheduled_date)} • ${appointment.status} • ${formatCurrency(appointment.price)}`,
          href: `/appointments?id=${appointment.id}`,
          icon: <Calendar className="h-4 w-4" />
        });
      }
    });

    // Limit results
    setResults(searchResults.slice(0, 10));
  }, [clients, appointments]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar clientes, agendamentos..."
          value={query}
          onChange={handleInputChange}
          className="pl-10 pr-10 bg-background/50 backdrop-blur-sm"
          onFocus={() => setIsOpen(query.length > 0)}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Results */}
      {isOpen && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-80 overflow-y-auto shadow-lg border-2">
          <CardContent className="p-0">
            {results.map((result, index) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={result.href}
                onClick={() => setIsOpen(false)}
                className="block"
              >
                <div className={cn(
                  "flex items-center space-x-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer",
                  index !== results.length - 1 && "border-b"
                )}>
                  <div className={cn(
                    "p-2 rounded-md",
                    result.type === 'client' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 
                    'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                  )}>
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {result.type === 'client' ? 'Cliente' : 'Agendamento'}
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {isOpen && query && results.length === 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
          <CardContent className="p-4 text-center text-muted-foreground text-sm">
            Nenhum resultado encontrado para "{query}"
          </CardContent>
        </Card>
      )}
    </div>
  );
}