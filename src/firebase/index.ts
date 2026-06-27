'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { firebaseConfig, isDemoMode } from './config';

export function initializeFirebase() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  const auth = getAuth(app);

  // Enable persistent login so users stay signed in after reopening the app
  if (!isDemoMode() && auth) {
    auth.setPersistence(browserLocalPersistence).catch(() => {
      // Fallback to session persistence if local persistence fails
      auth.setPersistence(browserSessionPersistence).catch(() => {
        // Silently fail - user will need to sign in again
      });
    });
  }

  return { app, firestore, auth };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export { errorEmitter } from './error-emitter';
export { FirestorePermissionError } from './errors';

