import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = getAdminFirestore();
    const reporterSnap = await db.collection('users').doc(decodedToken.uid).get();
    if (!reporterSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const validTargets = ['user', 'post', 'comment', 'code'];
    const body = await request.json();
    const { targetType, targetId, targetLabel, reason, description } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json({ error: 'Missing required fields: targetType, targetId, reason' }, { status: 400 });
    }

    if (!validTargets.includes(targetType)) {
      return NextResponse.json({ error: `Invalid targetType. Must be one of: ${validTargets.join(', ')}` }, { status: 400 });
    }

    if (reason.length < 3 || reason.length > 200) {
      return NextResponse.json({ error: 'Reason must be between 3 and 200 characters' }, { status: 400 });
    }

    const existingQuery = await db.collection('reports')
      .where('targetType', '==', targetType)
      .where('targetId', '==', targetId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (existingQuery.empty) {
      await db.collection('reports').add({
        targetType,
        targetId,
        targetLabel: targetLabel || '',
        reporterId: decodedToken.uid,
        reporterEmail: reporterSnap.data()!.email || '',
        reason,
        description: description || '',
        status: 'pending',
        reportCount: 1,
        lastReportedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      const existingDoc = existingQuery.docs[0];
      await existingDoc.ref.update({
        reportCount: FieldValue.increment(1),
        lastReportedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Report] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
