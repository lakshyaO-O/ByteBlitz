'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, browserLocalPersistence } from 'firebase/auth';
import { firebaseConfig, isDemoMode, validateFirebaseConfig } from './config';

let initialized = false;

export function initializeFirebase() {
  if (initialized) {
    const app = getApps().length > 0 ? getApp() : null;
    if (!app) {
      initialized = false;
      return initializeFirebase();
    }
    return {
      app,
      firestore: getFirestore(app),
      auth: getAuth(app),
    };
  }

  const demo = isDemoMode();

  if (!demo) {
    validateFirebaseConfig();
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  const auth = getAuth(app);

  initialized = true;

  if (!demo && auth) {
    auth.setPersistence(browserLocalPersistence).catch(() => {});
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
