@@ .. @@
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
+import { toast } from 'sonner';
 import { useAppStore } from '@/lib/store';
-import { useToast } from '@/hooks/use-toast';
 import type { Client } from '@/types/database';

 interface ClientEditDialogProps {
@@ .. @@

 export function ClientEditDialog({ client, open, onOpenChange }: ClientEditDialogProps) {
   const { updateClient } = useAppStore();
-  const { toast } = useToast();
   
   const [formData, setFormData] = useState({
@@ .. @@
       };

       updateClient(client.id, updatedData);

-      toast({
-        title: "Cliente atualizado",
-        description: "As informações do cliente foram salvas com sucesso.",
-      });
+      toast.success("Cliente atualizado com sucesso!");

       onOpenChange(false);
     } catch (error) {
       console.error('Error updating client:', error);
-      toast({
-        title: "Erro ao atualizar",
-        description: "Não foi possível atualizar as informações do cliente. Tente novamente.",
-        variant: "destructive",
-      });
+      toast.error("Erro ao atualizar cliente. Tente novamente.");
     } finally {
       setIsLoading(false);
     }