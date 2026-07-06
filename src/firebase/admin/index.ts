import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminInitialized = false;

type ValidationError = { message: string; variable?: string };

function validateEnv(): ValidationError[] {
  const errors: ValidationError[] = [];

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId) {
    errors.push({ message: 'Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID', variable: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' });
  }

  if (!clientEmail) {
    errors.push({ message: 'Missing FIREBASE_CLIENT_EMAIL', variable: 'FIREBASE_CLIENT_EMAIL' });
  } else if (!clientEmail.includes('@') || !clientEmail.includes('.')) {
    errors.push({ message: `Invalid FIREBASE_CLIENT_EMAIL: "${clientEmail}" is not a valid email address`, variable: 'FIREBASE_CLIENT_EMAIL' });
  }

  if (!privateKey) {
    errors.push({ message: 'Missing FIREBASE_PRIVATE_KEY', variable: 'FIREBASE_PRIVATE_KEY' });
  } else if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    errors.push({ message: 'Invalid FIREBASE_PRIVATE_KEY: must be a PEM string starting with -----BEGIN PRIVATE KEY-----', variable: 'FIREBASE_PRIVATE_KEY' });
  } else if (!privateKey.includes('-----END PRIVATE KEY-----')) {
    errors.push({ message: 'Invalid FIREBASE_PRIVATE_KEY: missing -----END PRIVATE KEY----- delimiter', variable: 'FIREBASE_PRIVATE_KEY' });
  }

  return errors;
}

function logErrors(errors: ValidationError[]): void {
  for (const err of errors) {
    console.error(`[Firebase Admin] ${err.message}`);
  }
}

export function initializeAdmin(): boolean {
  if (adminInitialized) return true;

  const errors = validateEnv();

  if (errors.length > 0) {
    logErrors(errors);
    console.warn('[Firebase Admin] Admin features disabled');
    return false;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!;

  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }
    adminInitialized = true;
    return true;
  } catch (err: any) {
    console.error(`[Firebase Admin] Initialization failed: ${err?.message || err}`);
    return false;
  }
}

export function getAdminAuth() {
  const initialized = initializeAdmin();
  if (!initialized) {
    throw new Error('Firebase Admin Auth unavailable: Admin SDK failed to initialize');
  }
  return getAuth();
}

export function getAdminFirestore() {
  const initialized = initializeAdmin();
  if (!initialized) {
    throw new Error('Firebase Admin Firestore unavailable: Admin SDK failed to initialize');
  }
  return getFirestore();
}
