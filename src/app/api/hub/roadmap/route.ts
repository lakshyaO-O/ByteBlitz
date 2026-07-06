import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest, isResponse, rateLimit, createAuditLog } from '@/lib/hub-utils';
import { roadmapItemSchema } from '@/lib/hub-validation';
import { hasPermission } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('roadmapItems').orderBy('createdAt', 'desc');

    if (status) query = query.where('status', '==', status);
    if (category) query = query.where('category', '==', category);

    const offset = (page - 1) * limit;
    const snap = await query.limit(limit).offset(offset).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ items, page, hasMore: items.length === limit });
  } catch (err: any) {
    console.error('[Roadmap GET] Error:', err);
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
    const parsed = roadmapItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = await db.collection('roadmapItems').add({
      ...parsed.data,
      votes: 0,
      votedBy: [],
      subscribers: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await createAuditLog({
      action: 'roadmap.created',
      performedBy: auth.uid,
      targetType: 'roadmapItem',
      targetId: ref.id,
      details: `Roadmap item: ${parsed.data.title}`,
    });

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[Roadmap POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true, 'content.manage' as any);
    if (isResponse(auth)) return auth;

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing roadmap item id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    await db.collection('roadmapItems').doc(id).update({
      ...fields,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Roadmap PUT] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server message' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true, 'content.manage' as any);
    if (isResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing roadmap item id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    await db.collection('roadmapItems').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Roadmap DELETE] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (isResponse(auth)) return auth;

    const body = await request.json();
    const { id, action: patchAction } = body;

    if (!id || !patchAction) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = db.collection('roadmapItems').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Roadmap item not found' }, { status: 404 });
    }

    const data = snap.data()!;
    const votedBy: string[] = data.votedBy || [];
    const subscribers: string[] = data.subscribers || [];

    if (patchAction === 'vote') {
      if (votedBy.includes(auth.uid)) {
        await ref.update({ votes: FieldValue.increment(-1), votedBy: FieldValue.arrayRemove(auth.uid) });
        return NextResponse.json({ voted: false });
      }
      await ref.update({ votes: FieldValue.increment(1), votedBy: FieldValue.arrayUnion(auth.uid) });
      return NextResponse.json({ voted: true });
    }

    if (patchAction === 'subscribe') {
      if (subscribers.includes(auth.uid)) {
        await ref.update({ subscribers: FieldValue.arrayRemove(auth.uid) });
        return NextResponse.json({ subscribed: false });
      }
      await ref.update({ subscribers: FieldValue.arrayUnion(auth.uid) });
      return NextResponse.json({ subscribed: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Roadmap PATCH] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
