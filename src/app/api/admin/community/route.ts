import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AdminRole } from '@/types/admin';
import { hasPermission } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { z } from 'zod';

async function verifyAndGetRole(request: NextRequest): Promise<{ uid: string; role: AdminRole; email: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse;
  }
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(decodedToken.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 }) as NextResponse;
    }
    const userData = userSnap.data()!;
    const role: AdminRole = userData.role || (userData.isAdmin ? 'admin' : 'user');
    return { uid: decodedToken.uid, role, email: userData.email || '' };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 }) as NextResponse;
  }
}

function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse;
}

const communityActionSchema = z.object({
  action: z.enum(['delete']),
  targetId: z.string().min(1),
  targetType: z.enum(['post', 'thread']),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAndGetRole(request);
    if (isErrorResponse(auth)) return auth;

    const rateCheck = checkRateLimit(auth.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    if (!hasPermission(auth.role, 'moderation.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminFirestore();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
    const typeFilter = searchParams.get('type') || 'all';
    const cursor = searchParams.get('cursor');
    const search = searchParams.get('q') || '';

    const results: any[] = [];

    if (typeFilter === 'all' || typeFilter === 'post') {
      let q: FirebaseFirestore.Query = db.collection('communityPosts').orderBy('createdAt', 'desc').limit(limit);
      if (cursor) {
        const cursorSnap = await db.collection('communityPosts').doc(cursor).get();
        if (cursorSnap.exists) q = q.startAfter(cursorSnap);
      }
      const snap = await q.get();
      snap.docs.forEach(d => {
        const data = d.data();
        results.push({ id: d.id, type: 'post', collection: 'communityPosts', ...data });
      });
    }

    if (typeFilter === 'all' || typeFilter === 'thread') {
      let q: FirebaseFirestore.Query = db.collection('forumThreads').orderBy('lastActivity', 'desc').limit(limit);
      if (cursor && typeFilter === 'thread') {
        const cursorSnap = await db.collection('forumThreads').doc(cursor).get();
        if (cursorSnap.exists) q = q.startAfter(cursorSnap);
      }
      const snap = await q.get();
      snap.docs.forEach(d => {
        const data = d.data();
        results.push({ id: d.id, type: 'thread', collection: 'forumThreads', ...data });
      });
    }

    results.sort((a, b) => {
      const ta = a.createdAt?.toDate?.()?.getTime() || new Date(a.createdAt || 0).getTime() || 0;
      const tb = b.createdAt?.toDate?.()?.getTime() || new Date(b.createdAt || 0).getTime() || 0;
      return tb - ta;
    });

    const serialized = results.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title || '',
      content: item.content || '',
      username: item.username || '',
      likes: item.likes || 0,
      createdAt: item.createdAt?.toDate?.()?.toISOString() || item.createdAt || '',
    }));

    const filtered = search
      ? serialized.filter(item =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.content.toLowerCase().includes(search.toLowerCase()) ||
          item.username.toLowerCase().includes(search.toLowerCase())
        )
      : serialized;

    return NextResponse.json({ items: filtered, total: filtered.length });
  } catch (err: any) {
    console.error('[Admin Community GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAndGetRole(request);
    if (isErrorResponse(auth)) return auth;

    const rateCheck = checkRateLimit(auth.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    const body = await request.json();
    const parsed = communityActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid request' }, { status: 400 });
    }

    const { action, targetId, targetType } = parsed.data;

    if (!hasPermission(auth.role, 'moderation.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminFirestore();
    const collectionName = targetType === 'thread' ? 'forumThreads' : 'communityPosts';

    const targetSnap = await db.collection(collectionName).doc(targetId).get();
    if (!targetSnap.exists) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const targetData = targetSnap.data()!;
    const targetLabel = targetData.title || targetId;

    await db.collection(collectionName).doc(targetId).delete();

    await db.collection('auditLogs').add({
      action: 'community.delete',
      performedBy: auth.uid,
      performedByEmail: auth.email,
      performedByRole: auth.role,
      targetType: targetType === 'thread' ? 'forum_thread' : 'community_post',
      targetId,
      targetLabel,
      severity: 'warning',
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Community POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
