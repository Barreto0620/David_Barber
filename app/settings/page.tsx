@@ .. @@
   const handleAddService = () => {
     if (!newServiceName || !newServicePrice || !newServiceDuration) {
       toast.error('Preencha todos os campos obrigatórios');
       return;
     }

-    const newService = {
-      id: `service_${Date.now()}`,
+    const newServiceData = {
       name: newServiceName,
       price: parseFloat(newServicePrice),
       duration_minutes: parseInt(newServiceDuration),
       description: newServiceDescription || undefined,
-      active: true,
     };

-    setServices([...services, newService]);
-    
-    // Reset form
-    setNewServiceName('');
-    setNewServicePrice('');
-    setNewServiceDuration('');
-    setNewServiceDescription('');
-    
-    toast.success('Serviço adicionado com sucesso!');
+    // In a real implementation, this would save to Supabase
+    const tempService = {
+      ...newServiceData,
+      id: `temp_${Date.now()}`,
+      active: true,
+      created_at: new Date().toISOString()
+    };
+
+    setServices([...services, tempService]);
+    
+    // Reset form
+    setNewServiceName('');
+    setNewServicePrice('');
+    setNewServiceDuration('');
+    setNewServiceDescription('');
+    
+    toast.success('Serviço adicionado com sucesso!');
   };