import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest, isResponse, rateLimit, createAuditLog } from '@/lib/hub-utils';
import { featureRequestSchema } from '@/lib/hub-validation';
import { hasPermission } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('featureRequests');

    if (status) query = query.where('status', '==', status);
    if (category) query = query.where('category', '==', category);

    if (sort === 'top') {
      query = query.orderBy('upvotes', 'desc');
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    const offset = (page - 1) * limit;
    const snap = await query.limit(limit).offset(offset).get();
    const features = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ features, page, hasMore: features.length === limit });
  } catch (err: any) {
    console.error('[Features GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (isResponse(auth)) return auth;

    const rl = rateLimit(auth.uid, request);
    if (rl) return rl;

    const body = await request.json();
    const parsed = featureRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = await db.collection('featureRequests').add({
      ...parsed.data,
      uid: auth.uid,
      username: '',
      upvotes: 0,
      upvotedBy: [],
      commentCount: 0,
      status: 'pending',
      adminNotes: null,
      duplicateOf: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const userSnap = await db.collection('users').doc(auth.uid).get();
    const username = userSnap.data()?.username || 'Anonymous';
    await ref.update({ username });

    await createAuditLog({
      action: 'feature.created',
      performedBy: auth.uid,
      targetType: 'featureRequest',
      targetId: ref.id,
      details: `Feature request: ${parsed.data.title}`,
    });

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[Features POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true);
    if (isResponse(auth)) return auth;

    if (!hasPermission(auth.role, 'content.manage' as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, adminNotes, duplicateOf } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = db.collection('featureRequests').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const update: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (duplicateOf !== undefined) update.duplicateOf = duplicateOf;

    await ref.update(update);

    await createAuditLog({
      action: `feature.${status || 'updated'}`,
      performedBy: auth.uid,
      targetType: 'featureRequest',
      targetId: id,
      details: `Status changed to ${status || 'updated'}`,
      previousState: snap.data(),
      newState: update,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Features PUT] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
