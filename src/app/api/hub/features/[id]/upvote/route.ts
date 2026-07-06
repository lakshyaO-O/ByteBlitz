import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest, isResponse, rateLimit } from '@/lib/hub-utils';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: featureId } = await params;
    const auth = await authenticateRequest(request);
    if (isResponse(auth)) return auth;

    const rl = rateLimit(auth.uid, request);
    if (rl) return rl;

    const db = getAdminFirestore();
    const ref = db.collection('featureRequests').doc(featureId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    const data = snap.data()!;
    const upvotedBy: string[] = data.upvotedBy || [];

    if (upvotedBy.includes(auth.uid)) {
      await ref.update({
        upvotes: FieldValue.increment(-1),
        upvotedBy: FieldValue.arrayRemove(auth.uid),
      });
      return NextResponse.json({ upvoted: false });
    }

    await ref.update({
      upvotes: FieldValue.increment(1),
      upvotedBy: FieldValue.arrayUnion(auth.uid),
    });
    return NextResponse.json({ upvoted: true });
  } catch (err: any) {
    console.error('[Feature Upvote] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
