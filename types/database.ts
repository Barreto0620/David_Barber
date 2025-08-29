@@ .. @@
 export interface Service {
   id: string;
   name: string;
   price: number;
   duration_minutes: number;
   description?: string;
   active: boolean;
+  created_at: string;
 }

 export interface DashboardMetrics {
@@ .. @@
 }

 export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
 export type PaymentMethod = 'dinheiro' | 'cartao' | 'pix' | 'transferencia';