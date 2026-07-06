import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest, isResponse, rateLimit, createAuditLog } from '@/lib/hub-utils';
import { eventSchema } from '@/lib/hub-validation';
import { hasPermission } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('hubEvents').orderBy('startTime', 'asc');

    if (status) {
      query = query.where('status', '==', status);
    } else if (upcoming === 'true') {
      query = query.where('status', '==', 'published');
      query = query.where('startTime', '>=', new Date().toISOString());
    }
    if (eventType) query = query.where('eventType', '==', eventType);

    const offset = (page - 1) * limit;
    const snap = await query.limit(limit).offset(offset).get();
    const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ events, page, hasMore: events.length === limit });
  } catch (err: any) {
    console.error('[HubEvents GET] Error:', err);
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
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = await db.collection('hubEvents').add({
      ...parsed.data,
      banner: parsed.data.banner || '',
      registrationLink: parsed.data.registrationLink || null,
      discordLink: parsed.data.discordLink || null,
      prizePool: parsed.data.prizePool || null,
      participantLimit: parsed.data.participantLimit || null,
      organizedBy: auth.uid,
      organizerEmail: auth.email,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await createAuditLog({
      action: 'event.created',
      performedBy: auth.uid,
      targetType: 'hubEvent',
      targetId: ref.id,
      details: `Event created: ${parsed.data.title}`,
    });

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[HubEvents POST] Error:', err);
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
      return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = db.collection('hubEvents').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await ref.update({ ...fields, updatedAt: FieldValue.serverTimestamp() });

    await createAuditLog({
      action: 'event.updated',
      performedBy: auth.uid,
      targetType: 'hubEvent',
      targetId: id,
      details: `Event updated`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[HubEvents PUT] Error:', err);
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
      return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    await db.collection('hubEvents').doc(id).delete();

    await createAuditLog({
      action: 'event.deleted',
      performedBy: auth.uid,
      targetType: 'hubEvent',
      targetId: id,
      details: 'Event deleted',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[HubEvents DELETE] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
