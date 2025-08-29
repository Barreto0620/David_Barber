@@ .. @@
   const handleSubmit = () => {
     if (!name.trim() || !phone.trim()) {
       toast.error('Nome e telefone são obrigatórios');
       return;
     }

     // Check if phone already exists
     const phoneExists = clients.some(client => client.phone === phone);
     if (phoneExists) {
       toast.error('Já existe um cliente com este telefone');
       return;
     }

-    const newClient: Client = {
-      id: `client_${Date.now()}`,
+    const newClientData = {
       name: name.trim(),
       phone: phone.trim(),
       email: email.trim() || undefined,
-      created_at: new Date().toISOString(),
-      total_visits: 0,
-      total_spent: 0,
       notes: notes.trim() || undefined,
     };

-    addClient(newClient);
-    toast.success('Cliente adicionado com sucesso!');
-    
-    // Reset form
-    setName('');
-    setPhone('');
-    setEmail('');
-    setNotes('');
-    
-    onSuccess();
-    onClose();
+    addClient(newClientData).then((result) => {
+      if (result) {
+        toast.success('Cliente adicionado com sucesso!');
+        
+        // Reset form
+        setName('');
+        setPhone('');
+        setEmail('');
+        setNotes('');
+        
+        onSuccess();
+        onClose();
+      } else {
+        toast.error('Erro ao adicionar cliente. Tente novamente.');
+      }
+    });
   };