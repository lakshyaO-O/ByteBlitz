'use client';

import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { AuditLog, AdminRole } from '@/types/admin';

interface CreateAuditLogParams {
  action: string;
  performedBy: string;
  performedByEmail: string;
  performedByRole: AdminRole;
  targetType: AuditLog['targetType'];
  targetId: string;
  targetLabel?: string;
  details?: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'critical';
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<string | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  try {
    const ref = await addDoc(collection(db, 'auditLogs'), {
      ...params,
      details: params.details || {},
      severity: params.severity || 'info',
      timestamp: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error('[AuditLog] Failed to create:', err);
    return null;
  }
}
