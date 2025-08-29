@@ .. @@
   const completeService = useCallback(() => {
     const newState = {
       isRunning: false,
       timeElapsed: timer.timeElapsed,
       isCompleted: true
     };
     
     setTimer(newState);
     localStorage.setItem(`timer-${appointment.id}`, JSON.stringify(newState));
-    updateAppointment(appointment.id, { status: 'completed', completed_at: new Date().toISOString() });
+    
+    // Don't auto-complete, just mark as ready for completion
+    updateAppointment(appointment.id, { status: 'in_progress' });
   }, [timer.timeElapsed, appointment.id, updateAppointment]);