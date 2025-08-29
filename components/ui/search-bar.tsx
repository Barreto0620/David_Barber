@@ .. @@
 'use client';

-import { useState, useCallback, useEffect } from 'react';
+import { useState, useCallback, useEffect, useRef } from 'react';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
@@ .. @@
 export function SearchBar({ className }: { className?: string }) {
   const [query, setQuery] = useState('');
   const [results, setResults] = useState<SearchResult[]>([]);
   const [isOpen, setIsOpen] = useState(false);
+  const searchRef = useRef<HTMLDivElement>(null);
   
   const { clients, appointments } = useAppStore();

+  // Close search when clicking outside
+  useEffect(() => {
+    const handleClickOutside = (event: MouseEvent) => {
+      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
+        setIsOpen(false);
+      }
+    };
+
+    document.addEventListener('mousedown', handleClickOutside);
+    return () => document.removeEventListener('mousedown', handleClickOutside);
+  }, []);

   const search = useCallback((searchQuery: string) => {
@@ .. @@
           client?.name.toLowerCase() || '';
         const serviceType = apt.service_type.toLowerCase();
         const paymentMethod = apt.payment_method?.toLowerCase() || '';
         const search = searchTerm.toLowerCase();
         
         return clientName.includes(search) || 
                serviceType.includes(search) || 
                paymentMethod.includes(search);
       });
     });
   }, [appointments, clients]);

   const clearSearch = () => {
     setQuery('');
     setResults([]);
     setIsOpen(false);
   };

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const value = e.target.value;
     setQuery(value);
     setIsOpen(value.length > 0);
   };

+  const handleResultClick = (href: string) => {
+    setIsOpen(false);
+    setQuery('');
+    setResults([]);
+    // Navigate to the result
+    window.location.href = href;
+  };

   return (
-    <div className={cn("relative", className)}>
+    <div ref={searchRef} className={cn("relative", className)}>
       <div className="relative">
@@ .. @@
               <Link
                 key={`${result.type}-${result.id}`}
                 href={result.href}
-                onClick={() => setIsOpen(false)}
+                onClick={() => handleResultClick(result.href)}
                 className="block"
               >
                 <div className={cn(