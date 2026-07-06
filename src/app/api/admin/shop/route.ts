import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AdminRole } from '@/types/admin';
import { hasPermission } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { shopActionSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data()!;
    const role: AdminRole = userData.role || (userData.isAdmin ? 'admin' : 'user');

    const rateCheck = checkRateLimit(uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    const body = await request.json();
    const parsed = shopActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid request' }, { status: 400 });
    }
    const { action, itemId, data } = parsed.data;

    switch (action) {
      case 'create': {
        if (!hasPermission(role, 'shop.write')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const ref = await db.collection('shop').add({
          ...data,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        await db.collection('auditLogs').add({
          action: 'shop.create',
          performedBy: uid,
          performedByEmail: userData.email || '',
          performedByRole: role,
          targetType: 'shop_item',
          targetId: ref.id,
          targetLabel: data.name || ref.id,
          severity: 'info',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true, id: ref.id });
      }

      case 'update': {
        if (!hasPermission(role, 'shop.write')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!itemId) {
          return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
        }
        const prevSnap = await db.collection('shop').doc(itemId).get();
        const prev = prevSnap.exists ? prevSnap.data() : {} as Record<string, unknown>;
        await db.collection('shop').doc(itemId).update({
          ...data,
          updatedAt: FieldValue.serverTimestamp(),
        });
        await db.collection('auditLogs').add({
          action: 'shop.update',
          performedBy: uid,
          performedByEmail: userData.email || '',
          performedByRole: role,
          targetType: 'shop_item',
          targetId: itemId,
          targetLabel: data.name || (prev as any).name || itemId,
          severity: 'info',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true });
      }

      case 'delete': {
        if (!hasPermission(role, 'shop.delete')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!itemId) {
          return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
        }
        const delSnap = await db.collection('shop').doc(itemId).get();
        const delName = delSnap.exists ? (delSnap.data()!.name || itemId) : itemId;
        await db.collection('shop').doc(itemId).delete();
        await db.collection('auditLogs').add({
          action: 'shop.delete',
          performedBy: uid,
          performedByEmail: userData.email || '',
          performedByRole: role,
          targetType: 'shop_item',
          targetId: itemId,
          targetLabel: delName,
          severity: 'warning',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[Admin Shop] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
