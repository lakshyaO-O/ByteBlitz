import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest, isResponse, rateLimit, createAuditLog } from '@/lib/hub-utils';
import { hostApplicationSchema } from '@/lib/hub-validation';
import { hasPermission } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true, 'moderation.read');
    if (isResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('hostApplications').orderBy('createdAt', 'desc');

    if (status) query = query.where('status', '==', status);

    const offset = (page - 1) * limit;
    const snap = await query.limit(limit).offset(offset).get();
    const applications = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ applications, page, hasMore: applications.length === limit });
  } catch (err: any) {
    console.error('[HostApplications GET] Error:', err);
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
    const parsed = hostApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = await db.collection('hostApplications').add({
      ...parsed.data,
      website: parsed.data.website || null,
      uid,
      status: 'pending',
      adminNotes: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[HostApplications POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true, 'moderation.write');
    if (isResponse(auth)) return auth;

    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing application id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = db.collection('hostApplications').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const update: Record<string, any> = {};
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    await ref.update(update);

    await createAuditLog({
      action: `host_application.${status || 'updated'}`,
      performedBy: auth.uid,
      targetType: 'hostApplication',
      targetId: id,
      details: `Application ${status || 'updated'}`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[HostApplications PUT] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
