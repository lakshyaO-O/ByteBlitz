'use client';

import React, { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error) => {
      // In a real dev environment, this would surface a rich error overlay.
      // For now, we use a toast for visibility.
      toast({
        variant: "destructive",
        title: "Security Rules Violation",
        description: error.message,
      });
      // We throw to trigger the Next.js error boundary/overlay in development
      throw error;
    });

    return () => unsubscribe();
  }, [toast]);

  return null;
}
