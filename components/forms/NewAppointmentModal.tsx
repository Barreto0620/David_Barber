@@ .. @@
   const handleSubmit = () => {
     if (!selectedClient || !selectedService || !selectedDate || !selectedTime) {
       toast.error('Por favor, preencha todos os campos obrigatórios');
       return;
     }

     const scheduledDateTime = new Date(selectedDate);
     const [hours, minutes] = selectedTime.split(':');
     scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

-    const appointment = {
-      id: `apt_${Date.now()}`,
+    const appointmentData = {
       client_id: selectedClient.id,
-      client: selectedClient,
       scheduled_date: scheduledDateTime.toISOString(),
       service_type: selectedService.name,
       status: 'scheduled' as const,
       price: customPrice ? parseFloat(customPrice) : selectedService.price,
       created_via: 'manual' as const,
       notes: notes || undefined,
     };

-    addAppointment(appointment);
-    toast.success('Agendamento criado com sucesso!');
-    
-    // Reset form
-    setSelectedClient(null);
-    setSelectedService(null);
-    setSelectedDate(undefined);
-    setSelectedTime('');
-    setCustomPrice('');
-    setNotes('');
-    
-    onSuccess();
-    onClose();
+    addAppointment(appointmentData).then((result) => {
+      if (result) {
+        toast.success('Agendamento criado com sucesso!');
+        
+        // Reset form
+        setSelectedClient(null);
+        setSelectedService(null);
+        setSelectedDate(undefined);
+        setSelectedTime('');
+        setCustomPrice('');
+        setNotes('');
+        
+        onSuccess();
+        onClose();
+      } else {
+        toast.error('Erro ao criar agendamento. Tente novamente.');
+      }
+    });
   };