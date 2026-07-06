import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AdminRole, AdminPermission } from '@/types/admin';
import { hasPermission, canManageRole } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { reportActionSchema } from '@/lib/validation';

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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const status = searchParams.get('status') || '';
    const targetType = searchParams.get('targetType') || '';
    const sort = searchParams.get('sort') || 'newest';

    let query: FirebaseFirestore.Query = db.collection('reports');

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.where('status', '==', status);
    }

    if (targetType && ['user', 'post', 'comment', 'code'].includes(targetType)) {
      query = query.where('targetType', '==', targetType);
    }

    if (sort === 'mostReported') {
      query = query.orderBy('reportCount', 'desc').orderBy('lastReportedAt', 'desc');
    } else {
      query = query.orderBy('lastReportedAt', 'desc');
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    const reports = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        targetType: data.targetType || '',
        targetId: data.targetId || '',
        targetLabel: data.targetLabel || '',
        reporterId: data.reporterId || '',
        reporterEmail: data.reporterEmail || '',
        reason: data.reason || '',
        description: data.description || '',
        status: data.status || 'pending',
        reportCount: data.reportCount || 1,
        resolvedBy: data.resolvedBy || '',
        resolvedByEmail: data.resolvedByEmail || '',
        resolutionNote: data.resolutionNote || '',
        actionTaken: data.actionTaken || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || '',
        lastReportedAt: data.lastReportedAt?.toDate?.()?.toISOString() || data.lastReportedAt || '',
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || data.resolvedAt || '',
      };
    });

    return NextResponse.json({ reports, total: snapshot.size });
  } catch (err: any) {
    console.error('[Admin Reports GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAndGetRole(request);
    if (isErrorResponse(auth)) return auth;

    const rateCheck = checkRateLimit(auth.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    if (!hasPermission(auth.role, 'moderation.write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminFirestore();
    const body = await request.json();
    const parsed = reportActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid request' }, { status: 400 });
    }
    const { reportId, action, reason: actionReason } = parsed.data;

    const reportSnap = await db.collection('reports').doc(reportId).get();
    if (!reportSnap.exists) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const reportData = reportSnap.data()!;
    if (reportData.status !== 'pending') {
      return NextResponse.json({ error: 'Report is already resolved' }, { status: 400 });
    }

    const targetId = reportData.targetId;
    const targetType = reportData.targetType;
    const targetLabel = reportData.targetLabel || '';

    if (action === 'approve') {
      await reportSnap.ref.update({
        status: 'approved',
        resolvedBy: auth.uid,
        resolvedByEmail: auth.email,
        actionTaken: 'none',
        resolutionNote: actionReason || '',
        resolvedAt: FieldValue.serverTimestamp(),
      });

      await db.collection('auditLogs').add({
        action: 'moderation.action',
        performedBy: auth.uid,
        performedByEmail: auth.email,
        performedByRole: auth.role,
        targetType: 'moderation',
        targetId: reportId,
        targetLabel: `Report: ${targetLabel}`,
        details: { action: 'approved', targetType, targetId, reason: actionReason },
        severity: 'info',
        timestamp: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, action: 'approved' });
    }

    if (action === 'reject') {
      await reportSnap.ref.update({
        status: 'rejected',
        resolvedBy: auth.uid,
        resolvedByEmail: auth.email,
        actionTaken: 'none',
        resolutionNote: actionReason || '',
        resolvedAt: FieldValue.serverTimestamp(),
      });

      await db.collection('auditLogs').add({
        action: 'moderation.action',
        performedBy: auth.uid,
        performedByEmail: auth.email,
        performedByRole: auth.role,
        targetType: 'moderation',
        targetId: reportId,
        targetLabel: `Report: ${targetLabel}`,
        details: { action: 'rejected', targetType, targetId, reason: actionReason },
        severity: 'info',
        timestamp: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, action: 'rejected' });
    }

    if (action === 'delete' || action === 'warn') {
      let permission: AdminPermission = action === 'delete' ? 'moderation.delete' : 'moderation.write';
      if (!hasPermission(auth.role, permission)) {
        return NextResponse.json({ error: `Forbidden: cannot ${action}` }, { status: 403 });
      }

      if (targetType === 'post' && action === 'delete') {
        try {
          await db.collection('communityPosts').doc(targetId).delete();
        } catch {
          // post may already be deleted
        }
      } else if (targetType === 'code' && action === 'delete') {
        try {
          await db.collection('codeShares').doc(targetId).delete();
        } catch {
          // already deleted
        }
      } else if (targetType === 'user') {
        if (!hasPermission(auth.role, 'users.ban')) {
          return NextResponse.json({ error: 'Forbidden: cannot take action on user' }, { status: 403 });
        }
        const targetSnap = await db.collection('users').doc(targetId).get();
        if (targetSnap.exists) {
          const targetRole: AdminRole = targetSnap.data()!.role || 'user';
          if (!canManageRole(auth.role, targetRole)) {
            return NextResponse.json({ error: 'Cannot act on users with equal or higher role' }, { status: 403 });
          }
        }
        if (action === 'delete') {
          await db.collection('users').doc(targetId).delete();
        }
      }

      const actionTaken = action === 'delete' ? 'deleted' : 'warned';
      await reportSnap.ref.update({
        status: 'approved',
        resolvedBy: auth.uid,
        resolvedByEmail: auth.email,
        actionTaken,
        resolutionNote: actionReason || '',
        resolvedAt: FieldValue.serverTimestamp(),
      });

      await db.collection('auditLogs').add({
        action: `moderation.${actionTaken}`,
        performedBy: auth.uid,
        performedByEmail: auth.email,
        performedByRole: auth.role,
        targetType: 'moderation',
        targetId: reportId,
        targetLabel: `Report: ${targetLabel}`,
        details: { action, targetType, targetId, reason: actionReason },
        severity: action === 'delete' ? 'critical' : 'warning',
        timestamp: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, action: actionTaken });
    }

    if (action === 'mute' || action === 'ban') {
      if (!hasPermission(auth.role, 'users.mute')) {
        return NextResponse.json({ error: 'Forbidden: cannot mute users' }, { status: 403 });
      }

      const targetSnap = await db.collection('users').doc(targetId).get();
      if (!targetSnap.exists) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }

      const targetRole: AdminRole = targetSnap.data()!.role || 'user';
      if (!canManageRole(auth.role, targetRole)) {
        return NextResponse.json({ error: 'Cannot act on users with equal or higher role' }, { status: 403 });
      }

      if (action === 'ban') {
        if (!hasPermission(auth.role, 'users.ban')) {
          return NextResponse.json({ error: 'Forbidden: cannot ban users' }, { status: 403 });
        }
        await db.collection('users').doc(targetId).update({
          banned: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        await db.collection('users').doc(targetId).update({
          muted: true,
          mutedReason: actionReason || 'Moderator action',
          mutedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      const actionTaken = action === 'ban' ? 'banned' : 'muted';
      await reportSnap.ref.update({
        status: 'approved',
        resolvedBy: auth.uid,
        resolvedByEmail: auth.email,
        actionTaken,
        resolutionNote: actionReason || '',
        resolvedAt: FieldValue.serverTimestamp(),
      });

      await db.collection('auditLogs').add({
        action: `moderation.${actionTaken}`,
        performedBy: auth.uid,
        performedByEmail: auth.email,
        performedByRole: auth.role,
        targetType: 'moderation',
        targetId: reportId,
        targetLabel: `Report: ${targetLabel}`,
        details: { action, targetType, targetId, reason: actionReason },
        severity: 'critical',
        timestamp: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, action: actionTaken });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('[Admin Reports POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
