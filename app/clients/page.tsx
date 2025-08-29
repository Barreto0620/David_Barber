@@ .. @@
   const filteredClients = clients.filter(client =>
     client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     client.phone.includes(searchTerm)
   );

-  const handleEditClient = (client: Client) => {
-    // Implementation for editing client
-    console.log('Edit client:', client);
-  };

   return (
@@ .. @@
           {filteredClients.map((client) => (
             <ClientProfile
               key={client.id}
               client={client}
-              onEdit={handleEditClient}
             />
           ))}
         </div>