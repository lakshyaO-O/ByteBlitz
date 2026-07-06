'use client';

import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { AdminRole, AdminPermission, AdminVerificationResult } from '@/types/admin';
import { hasPermission, ROLE_PERMISSIONS } from '@/types/admin';

export async function verifyAdmin(uid: string): Promise<AdminVerificationResult> {
  const { firestore: db } = initializeFirebase();
  if (!db) {
    return { uid, role: 'user', isAdmin: false, permissions: [] };
  }

  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) {
    return { uid, role: 'user', isAdmin: false, permissions: [] };
  }

  const data = snap.data();
  const role: AdminRole = data.role || (data.isAdmin ? 'admin' : 'user');
  const isAdmin = role === 'super_admin' || role === 'admin';
  const permissions = role === 'super_admin' ? ['*'] as unknown as AdminPermission[] : (ROLE_PERMISSIONS[role] || []);

  return { uid, role, isAdmin, permissions };
}

export async function checkPermission(uid: string, permission: AdminPermission): Promise<boolean> {
  const { role } = await verifyAdmin(uid);
  return hasPermission(role, permission);
}
