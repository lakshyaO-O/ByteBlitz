import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest, isResponse, rateLimit, createAuditLog } from '@/lib/hub-utils';
import { challengeSchema } from '@/lib/hub-validation';
import { hasPermission } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeType = searchParams.get('challengeType');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('hubChallenges').orderBy('startTime', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    } else if (upcoming === 'true') {
      query = query.where('status', '==', 'active');
      query = query.where('startTime', '>=', new Date().toISOString());
    }
    if (challengeType) query = query.where('challengeType', '==', challengeType);

    const offset = (page - 1) * limit;
    const snap = await query.limit(limit).offset(offset).get();
    const challenges = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ challenges, page, hasMore: challenges.length === limit });
  } catch (err: any) {
    console.error('[HubChallenges GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true);
    if (isResponse(auth)) return auth;

    if (!hasPermission(auth.role, 'content.write' as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = rateLimit(auth.uid, request);
    if (rl) return rl;

    const body = await request.json();
    const parsed = challengeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = await db.collection('hubChallenges').add({
      ...parsed.data,
      participantCount: 0,
      leaderboard: [],
      createdAt: FieldValue.serverTimestamp(),
    });

    await createAuditLog({
      action: 'challenge.created',
      performedBy: auth.uid,
      targetType: 'hubChallenge',
      targetId: ref.id,
      details: `Challenge created: ${parsed.data.title}`,
    });

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[HubChallenges POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true);
    if (isResponse(auth)) return auth;

    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing challenge id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = db.collection('hubChallenges').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    await ref.update(fields);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[HubChallenges PUT] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true);
    if (isResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing challenge id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    await db.collection('hubChallenges').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[HubChallenges DELETE] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
