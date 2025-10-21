'use client';

import { useState, useMemo } from 'react';
import { ClientProfile } from '@/components/clients/ClientProfile';
import { NewClientModal } from '@/components/forms/NewClientModal';
import { ClientEditDialog } from '@/components/clients/ClientEditDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Users, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Client } from '@/types/database';
import { cn } from '@/lib/utils'; // Assumindo que você tem um utilitário para concatenar classes

// Configuração da Paginação
const CLIENTS_PER_PAGE = 12;

export default function ClientsPage() {
  const { clients } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // Novo estado para a página atual

  const filteredClients = useMemo(() => {
    // Sempre que o filtro mudar, voltamos para a primeira página
    setCurrentPage(1);

    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  // Lógica para Paginação
  const totalPages = Math.ceil(filteredClients.length / CLIENTS_PER_PAGE);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * CLIENTS_PER_PAGE;
    const endIndex = startIndex + CLIENTS_PER_PAGE;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, currentPage]);

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
      // Opcional: rolar para o topo da página após a mudança
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

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground shrink-0">
          <Users className="h-4 w-4" />
          <span>{filteredClients.length} clientes encontrados</span>
        </div>
      </div>

      {/* Client List */}
      {paginatedClients.length === 0 && filteredClients.length > 0 ? (
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
      ) : filteredClients.length === 0 ? (
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
