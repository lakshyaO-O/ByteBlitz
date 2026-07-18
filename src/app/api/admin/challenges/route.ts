import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AdminRole } from '@/types/admin';
import { hasPermission } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

async function verifyAndGetRole(request: NextRequest): Promise<{ uid: string; role: AdminRole } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse;
  }
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(decodedToken.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 }) as NextResponse;
    }
    const userData = userSnap.data()!;
    const role: AdminRole = userData.role || (userData.isAdmin ? 'admin' : 'user');
    return { uid: decodedToken.uid, role };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 }) as NextResponse;
  }
}

function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAndGetRole(request);
    if (isErrorResponse(auth)) return auth;

    const rateCheck = checkRateLimit(auth.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    if (!hasPermission(auth.role, 'challenges.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminFirestore();
    const [dailySnap, weeklySnap] = await Promise.all([
      db.collection('challenges').doc('daily').get(),
      db.collection('challenges').doc('weekly').get(),
    ]);

    return NextResponse.json({
      daily: dailySnap.exists ? dailySnap.data() : null,
      weekly: weeklySnap.exists ? weeklySnap.data() : null,
    });
  } catch (err: any) {
    console.error('[Admin Challenges GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAndGetRole(request);
    if (isErrorResponse(auth)) return auth;

    const rateCheck = checkRateLimit(auth.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    if (!hasPermission(auth.role, 'challenges.write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminFirestore();
    const body = await request.json();
    const { action, data } = body;

    if (action === 'setDaily') {
      if (!data?.date || !data?.problemId) {
        return NextResponse.json({ error: 'Missing date or problemId' }, { status: 400 });
      }
      const snap = await db.collection('challenges').doc('daily').get();
      const challenges = snap.exists ? (snap.data()?.challenges || []) : [];
      const idx = challenges.findIndex((c: any) => c.date === data.date);
      if (idx >= 0) challenges[idx] = data;
      else challenges.push(data);
      await db.collection('challenges').doc('daily').set({ challenges }, { merge: true });
    } else if (action === 'setWeekly') {
      if (!data?.week || !data?.problemIds) {
        return NextResponse.json({ error: 'Missing week or problemIds' }, { status: 400 });
      }
      await db.collection('challenges').doc('weekly').set(data, { merge: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Challenges POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
