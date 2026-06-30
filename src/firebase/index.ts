'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, browserLocalPersistence } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './config';

interface FirebaseServices {
  app: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

const nullServices: FirebaseServices = { app: null, firestore: null, auth: null };

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function initializeFirebase(): FirebaseServices {
  if (!isFirebaseConfigured()) {
    if (typeof window !== 'undefined') {
      console.warn('[Firebase] Not configured — set NEXT_PUBLIC_FIREBASE_* env vars.');
    }
    return nullServices;
  }

  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig as any);
  } catch (err) {
    console.error('[Firebase] App initialization failed:', err);
    return nullServices;
  }

  try {
    firestoreInstance = getFirestore(appInstance);
  } catch (err) {
    console.error('[Firebase] Firestore initialization failed:', err);
  }

  try {
    authInstance = getAuth(appInstance);
    authInstance.setPersistence(browserLocalPersistence).catch((err) => {
      console.warn('[Firebase] Failed to set auth persistence:', err);
    });
  } catch (err) {
    console.error('[Firebase] Auth initialization failed:', err);
  }

  return { app: appInstance, firestore: firestoreInstance, auth: authInstance };
}

export function getFirebaseServices(): FirebaseServices {
  if (!appInstance) return initializeFirebase();
  return { app: appInstance, firestore: firestoreInstance, auth: authInstance };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export { errorEmitter } from './error-emitter';
export { FirestorePermissionError } from './errors';
