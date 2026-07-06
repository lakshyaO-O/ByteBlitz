import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { hasPermission, AdminRole } from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type AuthResult = { uid: string; email: string; role: AdminRole } | NextResponse;

export async function authenticateRequest(request: NextRequest, requireAdmin = false, permission?: string): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse;
  }
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userSnap.data();
    const role: AdminRole = userData?.role || (userData?.isAdmin ? 'admin' : 'user');

    if (requireAdmin || permission) {
      if (!hasPermission(role, permission || ('admin.manage' as any))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) as NextResponse;
      }
    }

    return { uid: decodedToken.uid, email: decodedToken.email || '', role };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 }) as NextResponse;
  }
}

export function isResponse(r: any): r is NextResponse {
  return r instanceof NextResponse;
}

export function rateLimit(uid: string, request: NextRequest): NextResponse | null {
  const check = checkRateLimit(uid, request);
  if (!check.allowed) return rateLimitResponse(check.retryAfterMs);
  return null;
}

export async function createAuditLog(params: {
  action: string;
  performedBy: string;
  targetType: string;
  targetId: string;
  details: string;
  previousState?: any;
  newState?: any;
}) {
  const db = getAdminFirestore();
  await db.collection('auditLogs').add({
    ...params,
    timestamp: FieldValue.serverTimestamp(),
    severity: 'info',
  });
}

export function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'Server';
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

export function detectOS(): string {
  if (typeof navigator === 'undefined') return 'Server';
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
}

export function detectDevice(): string {
  if (typeof navigator === 'undefined') return 'Server';
  const ua = navigator.userAgent;
  if (/Mobile|Android|iP(hone|od|ad)/.test(ua)) return 'Mobile';
  if (/Tablet|iPad/.test(ua)) return 'Tablet';
  return 'Desktop';
}
