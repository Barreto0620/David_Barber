@@ .. @@
             {appointment.status === 'scheduled' && (
               <div className="flex space-x-2">
                 {onComplete && (
                   <Button 
                     size="sm" 
                     onClick={() => onComplete(appointment.id)}
                     className="h-8"
                   >
                     <Check className="h-4 w-4" />
                   </Button>
                 )}
                 {onCancel && (
                   <Button 
                     size="sm" 
                     variant="destructive" 
                     onClick={() => onCancel(appointment.id)}
                     className="h-8"
                   >
                     <X className="h-4 w-4" />
                   </Button>
                 )}
               </div>
             )}
+            
+            {appointment.status === 'in_progress' && onComplete && (
+              <Button 
+                size="sm" 
+                onClick={() => onComplete(appointment.id)}
+                className="h-8 bg-green-600 hover:bg-green-700"
+              >
+                <Check className="h-4 w-4 mr-1" />
+                Finalizar
+              </Button>
+            )}
           </div>
           
           {appointment.notes && (