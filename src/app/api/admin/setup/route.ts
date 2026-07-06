import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { setupSchema } from '@/lib/validation';

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

    try {
      const body = await request.json();
      const parsed = setupSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid request' }, { status: 400 });
      }
    } catch {
      // No body or invalid JSON - setup endpoint accepts empty body
    }

    const db = getAdminFirestore();

    const existing = await db.collection('users').where('role', '==', 'super_admin').limit(1).get();
    if (!existing.empty && existing.docs[0].id !== uid) {
      return NextResponse.json({ error: 'Setup already completed. A super_admin already exists.' }, { status: 403 });
    }

    await db.collection('users').doc(uid).set(
      {
        role: 'super_admin',
        isAdmin: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return NextResponse.json({ success: true, uid, role: 'super_admin' });
  } catch (err: any) {
    console.error('[Admin Setup] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
