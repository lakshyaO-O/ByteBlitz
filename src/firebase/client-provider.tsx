'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const services = useMemo(() => {
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider app={services.app} firestore={services.firestore} auth={services.auth}>
      {children}
    </FirebaseProvider>
  );
};
