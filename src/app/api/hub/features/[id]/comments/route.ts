import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest, isResponse, rateLimit } from '@/lib/hub-utils';
import { featureCommentSchema } from '@/lib/hub-validation';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: featureId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const db = getAdminFirestore();
    const offset = (page - 1) * limit;
    const snap = await db.collection('featureRequests')
      .doc(featureId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .offset(offset)
      .get();

    const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ comments, page, hasMore: comments.length === limit });
  } catch (err: any) {
    console.error('[Feature Comments GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: featureId } = await params;
    const auth = await authenticateRequest(request);
    if (isResponse(auth)) return auth;

    const rl = rateLimit(auth.uid, request);
    if (rl) return rl;

    const body = await request.json();
    const parsed = featureCommentSchema.safeParse({ ...body, featureId });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getAdminFirestore();
    const featureRef = db.collection('featureRequests').doc(featureId);
    const featureSnap = await featureRef.get();
    if (!featureSnap.exists) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    const userSnap = await db.collection('users').doc(auth.uid).get();
    const userData = userSnap.data();

    const commentRef = await featureRef.collection('comments').add({
      featureId,
      uid: auth.uid,
      username: userData?.username || 'Anonymous',
      photoURL: userData?.photoURL || '',
      content: parsed.data.content,
      createdAt: FieldValue.serverTimestamp(),
    });

    await featureRef.update({
      commentCount: FieldValue.increment(1),
    });

    return NextResponse.json({ id: commentRef.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[Feature Comments POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
