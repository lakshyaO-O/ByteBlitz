import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest, isResponse, rateLimit, createAuditLog } from '@/lib/hub-utils';
import { contactSchema } from '@/lib/hub-validation';
import { hasPermission } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true, 'moderation.read');
    if (isResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('contactMessages').orderBy('createdAt', 'desc');

    if (status) query = query.where('status', '==', status);
    if (category) query = query.where('category', '==', category);

    const offset = (page - 1) * limit;
    const snap = await query.limit(limit).offset(offset).get();
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ messages, page, hasMore: messages.length === limit });
  } catch (err: any) {
    console.error('[Contact GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let uid: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const auth = await authenticateRequest(request);
        if (!isResponse(auth)) uid = auth.uid;
      } catch {}
    }

    const rl = rateLimit(uid || 'guest', request);
    if (rl) return rl;

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = await db.collection('contactMessages').add({
      ...parsed.data,
      uid,
      status: 'open',
      assignedTo: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[Contact POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true, 'moderation.write');
    if (isResponse(auth)) return auth;

    const body = await request.json();
    const { id, status, assignedTo } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = db.collection('contactMessages').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const update: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
    if (status) update.status = status;
    if (assignedTo) update.assignedTo = assignedTo;

    await ref.update(update);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Contact PUT] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
