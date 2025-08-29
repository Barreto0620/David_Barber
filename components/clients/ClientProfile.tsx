@@ .. @@
 'use client';

+import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
-import { User, Phone, Mail, Calendar, DollarSign, Hash } from 'lucide-react';
+import { User, Phone, Mail, Calendar, DollarSign, Hash, Edit } from 'lucide-react';
 import type { Client } from '@/types/database';
 import { formatCurrency, formatDate } from '@/lib/utils/currency';
 import { useAppStore } from '@/lib/store';
-import { useMemo } from 'react';
+import { useMemo } from 'react';
+import { ClientEditDialog } from './ClientEditDialog';

 interface ClientProfileProps {
   client: Client;
-  onEdit?: (client: Client) => void;
   className?: string;
 }

-export function ClientProfile({ client, onEdit, className }: ClientProfileProps) {
+export function ClientProfile({ client, className }: ClientProfileProps) {
   const appointments = useAppStore((state) => state.appointments);
+  const [editDialogOpen, setEditDialogOpen] = useState(false);
   
   const clientStats = useMemo(() => {
@@ .. @@
           </div>
         </div>
-        {onEdit && (
-          <Button variant="outline" size="sm" onClick={() => onEdit(client)}>
-            Editar
-          </Button>
-        )}
+        <Button 
+          variant="outline" 
+          size="sm" 
+          onClick={() => setEditDialogOpen(true)}
+        >
+          <Edit className="h-4 w-4 mr-1" />
+          Editar
+        </Button>
       </div>
     </CardHeader>

@@ .. @@
         )}
       </CardContent>
+      
+      <ClientEditDialog
+        client={client}
+        open={editDialogOpen}
+        onOpenChange={setEditDialogOpen}
+      />
     </Card>
   );
 }