'use client';

import { useState, useMemo } from 'react';
import { ClientProfile } from '@/components/clients/ClientProfile';
import { NewClientModal } from '@/components/forms/NewClientModal';
import { ClientEditDialog } from '@/components/clients/ClientEditDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Users, ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Clock, DollarSign as Dollar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Componentes Select simulados
import { useAppStore } from '@/lib/store';
import type { Client } from '@/types/database';
import { cn } from '@/lib/utils'; 

// Configuração da Paginação
const CLIENTS_PER_PAGE = 12;

// Tipos de Ordenação
type SortOption = 
  | 'recent'
  | 'oldest'
  | 'most_visits'
  | 'least_visits'
  | 'highest_spend'
  | 'lowest_spend';

export default function ClientsPage() {
  const { clients } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent'); // Novo estado de ordenação
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Lógica de Filtragem e Ordenação
  const sortedAndFilteredClients = useMemo(() => {
    // 1. Filtragem por nome/telefone
    let result = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    );
    
    // Se a busca mudar, voltamos para a primeira página.
    // NOTE: Não chamamos setCurrentPage diretamente aqui dentro do useMemo,
    // mas o reset é implícito, pois qualquer mudança no retorno do useMemo
    // forçará o recálculo da paginação.

    // 2. Ordenação
    result.sort((a, b) => {
      // Funções auxiliares para obter valores numéricos de forma segura
      const getNumericValue = (value: any) => {
        // Tenta converter para número, retornando 0 se for NaN, null, ou undefined
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      };
      
      const getVisits = (client: Client) => getNumericValue(client.total_visits);
      const getSpent = (client: Client) => getNumericValue(client.total_spent);

      switch (sortOption) {
        case 'most_visits':
          // Maior para Menor (b - a)
          return getVisits(b) - getVisits(a);
        case 'least_visits':
          // Menor para Maior (a - b)
          return getVisits(a) - getVisits(b);
        case 'highest_spend':
          // Maior para Menor
          return getSpent(b) - getSpent(a);
        case 'lowest_spend':
          // Menor para Maior
          return getSpent(a) - getSpent(b);
        case 'recent':
          // Mais Novos (Data de Criação: b - a)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          // Mais Antigos (Data de Criação: a - b)
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [clients, searchTerm, sortOption]); // Depende do searchTerm e sortOption

  // Resetar a página para 1 quando o filtro ou ordenação muda
  useMemo(() => {
    setCurrentPage(1);
  }, [sortedAndFilteredClients.length]);


  // Lógica para Paginação
  const totalPages = Math.ceil(sortedAndFilteredClients.length / CLIENTS_PER_PAGE);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * CLIENTS_PER_PAGE;
    const endIndex = startIndex + CLIENTS_PER_PAGE;
    return sortedAndFilteredClients.slice(startIndex, endIndex);
  }, [sortedAndFilteredClients, currentPage]);

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditClientDialogOpen(true);
  };
  
  const handleOpenChange = (open: boolean) => {
    setEditClientDialogOpen(open);
    if (!open) {
      setSelectedClient(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Cria um array de números de página para renderização
  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie a base de clientes da barbearia
          </p>
        </div>
        <Button onClick={() => setNewClientModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Search, Filter and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        
        {/* Campo de Busca */}
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full"
          />
        </div>

        {/* Dropdown de Ordenação (Novo Componente) */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <label className="text-sm text-muted-foreground shrink-0 hidden sm:block">Ordenar por:</label>
          {/* Implementação do Select de Ordenação */}
          <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                <Clock className="h-4 w-4 mr-2 inline-block" /> Mais Novos
              </SelectItem>
              <SelectItem value="oldest">
                <Clock className="h-4 w-4 mr-2 inline-block" /> Mais Antigos
              </SelectItem>
              <SelectItem value="most_visits">
                <TrendingUp className="h-4 w-4 mr-2 inline-block" /> Mais Visitas
              </SelectItem>
              <SelectItem value="least_visits">
                <TrendingDown className="h-4 w-4 mr-2 inline-block" /> Menos Visitas
              </SelectItem>
              <SelectItem value="highest_spend">
                <Dollar className="h-4 w-4 mr-2 inline-block" /> Maior Gasto Total
              </SelectItem>
              <SelectItem value="lowest_spend">
                <Dollar className="h-4 w-4 mr-2 inline-block" /> Menor Gasto Total
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground shrink-0 mt-2 sm:mt-0">
          <Users className="h-4 w-4" />
          <span>{sortedAndFilteredClients.length} clientes encontrados</span>
        </div>
      </div>

      {/* Client List */}
      {paginatedClients.length === 0 && sortedAndFilteredClients.length > 0 ? (
          <Card>
            <CardContent className="p-8">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Nenhum cliente na página atual</p>
                  <p className="text-muted-foreground">
                    Volte para uma página anterior
                  </p>
                </div>
              </CardContent>
          </Card>
      ) : sortedAndFilteredClients.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhum cliente encontrado</p>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar sua busca' : 'Comece adicionando seu primeiro cliente'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedClients.map((client) => (
            <ClientProfile
              key={client.id}
              client={client}
              onEdit={handleEditClient}
            />
          ))}
        </div>
      )}

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Renderização dos números de página */}
          <div className="flex space-x-1">
            {pageNumbers.map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className={cn(
                  "w-10 h-10",
                  page === currentPage && "bg-primary text-primary-foreground"
                )}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* New Client Modal */}
      <NewClientModal
        open={newClientModalOpen}
        onClose={() => setNewClientModalOpen(false)}
        onSuccess={() => {}}
      />
      
      {/* Edit Client Dialog */}
      <ClientEditDialog
        client={selectedClient}
        open={editClientDialogOpen}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
}
