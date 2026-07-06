import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { authenticateRequest, isResponse, rateLimit, createAuditLog } from '@/lib/hub-utils';
import { bugReportSchema } from '@/lib/hub-validation';
import { hasPermission } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true, 'moderation.read');
    if (isResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('bugReports').orderBy('createdAt', 'desc');

    if (status) query = query.where('status', '==', status);
    if (severity) query = query.where('severity', '==', severity);
    if (category) query = query.where('category', '==', category);

    const offset = (page - 1) * limit;
    const snap = await query.limit(limit).offset(offset).get();
    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ reports, page, hasMore: reports.length === limit });
  } catch (err: any) {
    console.error('[BugReports GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let uid: string | null = null;
    let username: string | null = null;
    let email: string | null = null;

    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const auth = await authenticateRequest(request);
        if (!isResponse(auth)) {
          uid = auth.uid;
          email = auth.email;
          const db = getAdminFirestore();
          const userSnap = await db.collection('users').doc(uid).get();
          username = userSnap.data()?.username || null;
        }
      } catch {}
    }

    const rateCheck = rateLimit(uid || 'guest', request);
    if (rateCheck) return rateCheck;

    const body = await request.json();
    const parsed = bugReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = await db.collection('bugReports').add({
      ...parsed.data,
      screenshotUrl: parsed.data.screenshotUrl || null,
      contactEmail: parsed.data.contactEmail || '',
      uid,
      username,
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      status: 'open',
      assignedTo: null,
      resolution: null,
      resolvedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await createAuditLog({
      action: 'bug_report.created',
      performedBy: uid || 'guest',
      targetType: 'bugReport',
      targetId: ref.id,
      details: `Bug report submitted: ${parsed.data.title}`,
    });

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[BugReports POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true, 'moderation.write');
    if (isResponse(auth)) return auth;

    if (!hasPermission(auth.role, 'moderation.write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, assignedTo, resolution } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing report id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = db.collection('bugReports').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const update: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
    if (status) update.status = status;
    if (assignedTo) update.assignedTo = assignedTo;
    if (resolution) update.resolution = resolution;
    if (status === 'resolved') update.resolvedAt = FieldValue.serverTimestamp();

    if (status === 'spam') {
      await ref.delete();
      await createAuditLog({
        action: 'bug_report.deleted_spam',
        performedBy: auth.uid,
        targetType: 'bugReport',
        targetId: id,
        details: `Spam bug report deleted`,
      });
      return NextResponse.json({ success: true, deleted: true });
    }

    await ref.update(update);
    await createAuditLog({
      action: `bug_report.${status || 'updated'}`,
      performedBy: auth.uid,
      targetType: 'bugReport',
      targetId: id,
      details: `Status changed to ${status || 'updated'}`,
      previousState: snap.data(),
      newState: update,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[BugReports PUT] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true, 'moderation.write');
    if (isResponse(auth)) return auth;

    if (!hasPermission(auth.role, 'moderation.write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing report id' }, { status: 400 });
    }

    const db = getAdminFirestore();
    await db.collection('bugReports').doc(id).delete();

    await createAuditLog({
      action: 'bug_report.deleted',
      performedBy: auth.uid,
      targetType: 'bugReport',
      targetId: id,
      details: 'Bug report permanently deleted',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[BugReports DELETE] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
