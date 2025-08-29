@@ .. @@
   const handleServiceCompletion = (paymentMethod: PaymentMethod, finalPrice: number, notes?: string) => {
     if (!selectedAppointment) return;
     
-    completeAppointment(selectedAppointment.id, paymentMethod, finalPrice);
-    toast.success('Atendimento finalizado com sucesso!');
-    
-    setSelectedAppointment(null);
-    setCompletionModalOpen(false);
+    completeAppointment(selectedAppointment.id, paymentMethod, finalPrice).then((success) => {
+      if (success) {
+        toast.success('Atendimento finalizado com sucesso!');
+        setSelectedAppointment(null);
+        setCompletionModalOpen(false);
+      } else {
+        toast.error('Erro ao finalizar atendimento. Tente novamente.');
+      }
+    });
   };

   const handleCancelAppointment = (id: string) => {
-    toast.info('Agendamento cancelado');
+    updateAppointment(id, { status: 'cancelled' }).then((success) => {
+      if (success) {
+        toast.success('Agendamento cancelado com sucesso!');
+      } else {
+        toast.error('Erro ao cancelar agendamento.');
+      }
+    });
   };