@@ .. @@
   const handleComplete = () => {
     if (!appointment) return;
     
     const price = finalPrice ? parseFloat(finalPrice) : appointment.price;
-    onComplete(paymentMethod, price, notes || undefined);
+    
+    if (isNaN(price) || price <= 0) {
+      toast.error('Preço deve ser um valor válido maior que zero');
+      return;
+    }
+    
+    onComplete(paymentMethod, price, notes || undefined);
     
     // Reset form
     setPaymentMethod('dinheiro');
@@ -84,6 +91,10 @@ export function ServiceCompletionModal({ 
     onClose();
   };

+  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
+    setFinalPrice(e.target.value);
+  };
+
   if (!appointment) return null;

   const client = getClientById(appointment.client_id);
@@ .. @@
             <Input
               id="finalPrice"
               type="number"
               step="0.01"
+              min="0"
               placeholder={appointment.price.toString()}
               value={finalPrice}
-              onChange={(e) => setFinalPrice(e.target.value)}
+              onChange={handlePriceChange}
             />
           </div>