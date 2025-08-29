@@ .. @@
   // Auto-sync on component mount and periodically
   useEffect(() => {
     const initializeData = async () => {
-      if (!lastSync || Date.now() - new Date(lastSync).getTime() > 5 * 60 * 1000) {
+      if (!lastSync || Date.now() - new Date(lastSync).getTime() > 2 * 60 * 1000) {
         await syncWithSupabase();
       } else {
         calculateMetrics();
       }
     };

     initializeData();

-    // Auto-refresh every 5 minutes
+    // Auto-refresh every 2 minutes
     const interval = setInterval(() => {
       syncWithSupabase();
-    }, 5 * 60 * 1000);
+    }, 2 * 60 * 1000);

     return () => clearInterval(interval);
   }, [syncWithSupabase, calculateMetrics, lastSync]);