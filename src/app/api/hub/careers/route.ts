import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest, isResponse, rateLimit, createAuditLog } from '@/lib/hub-utils';
import { careerSchema } from '@/lib/hub-validation';
import { hasPermission } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('careerOpportunities').orderBy('createdAt', 'desc');

    if (status) query = query.where('status', '==', status);
    if (category) query = query.where('category', '==', category);

    const offset = (page - 1) * limit;
    const snap = await query.limit(limit).offset(offset).get();
    const careers = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ careers, page, hasMore: careers.length === limit });
  } catch (err: any) {
    console.error('[HubCareers GET] Error:', err);
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
    const parsed = careerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = await db.collection('careerOpportunities').add({
      ...parsed.data,
      location: parsed.data.location || null,
      applicationLink: parsed.data.applicationLink || null,
      contactEmail: parsed.data.contactEmail || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[HubCareers POST] Error:', err);
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
      return NextResponse.json({ error: 'Missing career id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    await db.collection('careerOpportunities').doc(id).update({
      ...fields,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[HubCareers PUT] Error:', err);
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
      return NextResponse.json({ error: 'Missing career id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    await db.collection('careerOpportunities').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[HubCareers DELETE] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
