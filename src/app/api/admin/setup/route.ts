import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { setupSchema } from '@/lib/validation';

class SetupAbortError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message);
    this.name = 'SetupAbortError';
  }
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

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

    // Optional shared secret: when SETUP_SECRET is set, the caller must prove it.
    const setupSecret = process.env.SETUP_SECRET;
    const providedSecret = request.headers.get('X-Setup-Secret') || '';
    if (setupSecret && !safeEqual(providedSecret, setupSecret)) {
      return NextResponse.json({ error: 'Invalid setup secret' }, { status: 403 });
    }

    const db = getAdminFirestore();

    const setupEmail = process.env.ADMIN_SETUP_EMAIL;
    if (setupEmail && decodedToken.email && decodedToken.email.toLowerCase() !== setupEmail.toLowerCase()) {
      return NextResponse.json({ error: 'This account is not authorized for setup' }, { status: 403 });
    }

    await db.runTransaction(async (tx) => {
      const lockRef = db.collection('config').doc('setupLock');
      const lockSnap = await tx.get(lockRef);
      const claimedBy = lockSnap.exists ? (lockSnap.data() as any)?.claimedBy : null;
      if (claimedBy && claimedBy !== uid) {
        throw new SetupAbortError('Setup already completed. A super_admin already exists.');
      }
      if (!claimedBy) {
        // First claimant wins the transaction; concurrent callers are rejected.
        tx.set(lockRef, { claimedBy: uid, claimedAt: new Date().toISOString() });
      }
      tx.set(
        db.collection('users').doc(uid),
        {
          role: 'super_admin',
          isAdmin: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    });

    return NextResponse.json({ success: true, uid, role: 'super_admin' });
  } catch (err: any) {
    if (err instanceof SetupAbortError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[Admin Setup] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
