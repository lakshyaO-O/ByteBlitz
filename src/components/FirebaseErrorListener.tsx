'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const unsub = errorEmitter.on('permission-error', (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Permission Error',
        description: 'Your request was denied by security rules. Please try again.',
      });
    });

    return unsub;
  }, [toast]);

  return null;
}
