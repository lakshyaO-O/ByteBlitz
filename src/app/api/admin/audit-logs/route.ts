import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { AdminRole } from '@/types/admin';
import { hasPermission } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(decodedToken.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const role: AdminRole = userSnap.data()!.role || (userSnap.data()!.isAdmin ? 'admin' : 'user');
    const rateCheck = checkRateLimit(decodedToken.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    if (!hasPermission(role, 'audit.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const performedBy = searchParams.get('performedBy');
    const severity = searchParams.get('severity');

    let query: FirebaseFirestore.Query = db.collection('auditLogs').orderBy('timestamp', 'desc').limit(limit);

    if (action) query = query.where('action', '==', action);
    if (targetType) query = query.where('targetType', '==', targetType);
    if (performedBy) query = query.where('performedBy', '==', performedBy);
    if (severity) query = query.where('severity', '==', severity);

    const snapshot = await query.get();
    const logs = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        action: data.action || '',
        performedBy: data.performedBy || '',
        performedByEmail: data.performedByEmail || '',
        performedByRole: data.performedByRole || '',
        targetType: data.targetType || '',
        targetId: data.targetId || '',
        targetLabel: data.targetLabel || '',
        details: data.details || {},
        previousState: data.previousState || null,
        newState: data.newState || null,
        severity: data.severity || 'info',
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp || '',
        ipAddress: data.ipAddress || '',
      };
    });

    return NextResponse.json({ logs, total: snapshot.size });
  } catch (err: any) {
    console.error('[Audit Logs] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
