// project/app/clients/page.tsx
'use client';

import { useState } from 'react';
import { ClientProfile } from '@/components/clients/ClientProfile';
import { NewClientModal } from '@/components/forms/NewClientModal';
import { ClientEditDialog } from '@/components/clients/ClientEditDialog'; // Importe o novo componente
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Users } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Client } from '@/types/database';

export default function ClientsPage() {
  const { clients } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false); // Novo estado
  const [selectedClient, setSelectedClient] = useState<Client | null>(null); // Novo estado

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditClientDialogOpen(true);
  };
  
  const handleOpenChange = (open: boolean) => {
    setEditClientDialogOpen(open);
    if (!open) {
      setSelectedClient(null); // Limpa o cliente selecionado ao fechar o diálogo
    }
  };

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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{filteredClients.length} clientes encontrados</span>
        </div>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
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
          {filteredClients.map((client) => (
            <ClientProfile
              key={client.id}
              client={client}
              onEdit={handleEditClient} // Passa a função de edição para o componente
            />
          ))}
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