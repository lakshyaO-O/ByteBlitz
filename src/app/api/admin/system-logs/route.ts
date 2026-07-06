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
    if (!hasPermission(role, 'settings.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const level = searchParams.get('level');

    let query: FirebaseFirestore.Query = db.collection('systemLogs')
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (level) query = query.where('level', '==', level);
    const snapshot = await query.get();

    const logs = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        level: data.level || 'info',
        message: data.message || '',
        source: data.source || data.service || 'app',
        service: data.service || '',
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp || new Date().toISOString(),
        details: data.details || {},
      };
    });

    return NextResponse.json({ logs, total: snapshot.size });
  } catch (err: any) {
    console.error('[System Logs] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
