@@ .. @@
 import { createClient } from '@supabase/supabase-js';

-const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
-const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
+const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
+const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

-export const supabase = createClient(supabaseUrl, supabaseAnonKey);
+if (!supabaseUrl || !supabaseAnonKey) {
+  console.warn('Supabase environment variables not found. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
+}

+export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
+  auth: {
+    persistSession: false
+  }
+});