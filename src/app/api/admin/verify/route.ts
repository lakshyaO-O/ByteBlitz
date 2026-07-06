import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { AdminRole, AdminPermission } from '@/types/admin';
import { ROLE_PERMISSIONS } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const rateCheck = checkRateLimit(uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(uid).get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data()!;
    const role: AdminRole = userData.role || (userData.isAdmin ? 'admin' : 'user');
    const isAdmin = role === 'super_admin' || role === 'admin';
    const permissions: AdminPermission[] = role === 'super_admin'
      ? ['*'] as unknown as AdminPermission[]
      : (ROLE_PERMISSIONS[role] || []);

    return NextResponse.json({
      uid,
      role,
      isAdmin,
      permissions,
      email: userData.email || '',
      username: userData.username || '',
    });
  } catch (err: any) {
    console.error('[Admin Verify] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
