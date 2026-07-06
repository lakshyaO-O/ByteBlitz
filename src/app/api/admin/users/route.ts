import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AdminRole } from '@/types/admin';
import { hasPermission, canManageRole } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { userActionSchema, bulkUserActionSchema } from '@/lib/validation';

async function verifyAndGetRole(request: NextRequest): Promise<{ uid: string; role: AdminRole; email: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse;
  }

  const idToken = authHeader.slice(7);
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
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

    if (!hasPermission(auth.role, 'users.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminFirestore();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const lastDoc = searchParams.get('lastDoc');

    let query: FirebaseFirestore.Query = db.collection('users').orderBy('createdAt', 'desc').limit(limit);
    if (lastDoc) {
      const lastSnap = await db.collection('users').doc(lastDoc).get();
      if (lastSnap.exists) {
        query = query.startAfter(lastSnap);
      }
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        uid: data.uid || d.id,
        username: data.username || '',
        email: data.email || '',
        photoURL: data.photoURL || '',
        role: data.role || 'user',
        isAdmin: data.isAdmin || false,
        banned: data.banned || false,
        xp: data.xp || 0,
        devcoins: data.devcoins || 0,
        coins: data.coins || 0,
        level: data.level || 0,
        rating: data.rating || 0,
        tier: data.tier || 'Beginner',
        subscriptionTier: data.subscriptionTier || 'free',
        streak: data.streak || 0,
        wins: data.wins || 0,
        losses: data.losses || 0,
        draws: data.draws || 0,
        createdAt: data.createdAt || '',
        lastActive: data.lastActive || '',
        bio: data.bio || '',
        publicId: data.publicId || '',
      };
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return NextResponse.json({
      users,
      total: snapshot.size,
      nextCursor: lastVisible?.id || null,
    });
  } catch (err: any) {
    console.error('[Admin Users GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAndGetRole(request);
    if (isErrorResponse(auth)) return auth;

    const rateCheck = checkRateLimit(auth.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    const body = await request.json();

    const schema = body.action === 'bulk' ? bulkUserActionSchema : userActionSchema;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid request' }, { status: 400 });
    }
    const { action, targetUid, data } = parsed.data;

    const db = getAdminFirestore();
    const targetSnap = await db.collection('users').doc(targetUid).get();
    if (!targetSnap.exists) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const targetData = targetSnap.data()!;
    const targetRole: AdminRole = targetData.role || 'user';

    switch (action) {
      case 'updateRole': {
        if (!hasPermission(auth.role, 'users.role')) {
          return NextResponse.json({ error: 'Forbidden: cannot manage roles' }, { status: 403 });
        }
        const newRole: AdminRole = data.role as AdminRole;
        if (!newRole) {
          return NextResponse.json({ error: 'Missing role' }, { status: 400 });
        }
        if (!canManageRole(auth.role, targetRole)) {
          return NextResponse.json({ error: 'Cannot manage users with equal or higher role' }, { status: 403 });
        }
        if (!canManageRole(auth.role, newRole)) {
          return NextResponse.json({ error: 'Cannot assign this role' }, { status: 403 });
        }
        const previousRole = targetRole;
        await db.collection('users').doc(targetUid).update({
          role: newRole,
          isAdmin: newRole === 'super_admin' || newRole === 'admin',
          updatedAt: FieldValue.serverTimestamp(),
        });
        await db.collection('auditLogs').add({
          action: 'user.role.change',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'user',
          targetId: targetUid,
          targetLabel: targetData.username || targetData.email || targetUid,
          previousState: { role: previousRole },
          newState: { role: newRole },
          severity: 'warning',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true, previousRole, newRole });
      }

      case 'ban': {
        if (!hasPermission(auth.role, 'users.ban')) {
          return NextResponse.json({ error: 'Forbidden: cannot ban users' }, { status: 403 });
        }
        if (auth.uid === targetUid) {
          return NextResponse.json({ error: 'Cannot ban yourself' }, { status: 400 });
        }
        if (!canManageRole(auth.role, targetRole)) {
          return NextResponse.json({ error: 'Cannot ban users with equal or higher role' }, { status: 403 });
        }
        await db.collection('users').doc(targetUid).update({
          banned: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
        await db.collection('auditLogs').add({
          action: 'user.ban',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'user',
          targetId: targetUid,
          targetLabel: targetData.username || targetData.email || targetUid,
          severity: 'critical',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true, banned: true });
      }

      case 'unban': {
        if (!hasPermission(auth.role, 'users.ban')) {
          return NextResponse.json({ error: 'Forbidden: cannot unban users' }, { status: 403 });
        }
        if (!canManageRole(auth.role, targetRole)) {
          return NextResponse.json({ error: 'Cannot unban users with equal or higher role' }, { status: 403 });
        }
        await db.collection('users').doc(targetUid).update({
          banned: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
        await db.collection('auditLogs').add({
          action: 'user.unban',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'user',
          targetId: targetUid,
          targetLabel: targetData.username || targetData.email || targetUid,
          severity: 'info',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true, banned: false });
      }

      case 'updateProfile': {
        if (!hasPermission(auth.role, 'users.write')) {
          return NextResponse.json({ error: 'Forbidden: cannot edit users' }, { status: 403 });
        }
        if (!canManageRole(auth.role, targetRole)) {
          return NextResponse.json({ error: 'Cannot edit users with equal or higher role' }, { status: 403 });
        }
        const allowedFields = ['username', 'bio', 'xp', 'coins', 'devcoins', 'level', 'rating', 'tier', 'subscriptionTier'];
        const sanitized: Record<string, unknown> = {};
        for (const key of allowedFields) {
          if (data[key] !== undefined) {
            sanitized[key] = data[key];
          }
        }
        if (Object.keys(sanitized).length === 0) {
          return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }
        sanitized.updatedAt = FieldValue.serverTimestamp();
        await db.collection('users').doc(targetUid).update(sanitized);
        await db.collection('auditLogs').add({
          action: 'user.update',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'user',
          targetId: targetUid,
          targetLabel: targetData.username || targetData.email || targetUid,
          details: { updatedFields: Object.keys(sanitized) },
          previousState: allowedFields.reduce((acc: Record<string, unknown>, key) => {
            if (targetData[key] !== undefined) acc[key] = targetData[key];
            return acc;
          }, {}),
          newState: sanitized,
          severity: 'info',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true, updated: Object.keys(sanitized) });
      }

      case 'delete': {
        if (!hasPermission(auth.role, 'users.delete')) {
          return NextResponse.json({ error: 'Forbidden: cannot delete users' }, { status: 403 });
        }
        if (auth.uid === targetUid) {
          return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }
        if (!canManageRole(auth.role, targetRole)) {
          return NextResponse.json({ error: 'Cannot delete users with equal or higher role' }, { status: 403 });
        }
        const username = targetData.username || targetData.email || targetUid;
        await db.collection('users').doc(targetUid).delete();
        await db.collection('auditLogs').add({
          action: 'user.delete',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'user',
          targetId: targetUid,
          targetLabel: username,
          severity: 'critical',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true, deleted: targetUid });
      }

      case 'mute': {
        if (!hasPermission(auth.role, 'users.mute')) {
          return NextResponse.json({ error: 'Forbidden: cannot mute users' }, { status: 403 });
        }
        if (!canManageRole(auth.role, targetRole)) {
          return NextResponse.json({ error: 'Cannot mute users with equal or higher role' }, { status: 403 });
        }
        const muteReason = data?.reason || 'No reason provided';
        await db.collection('users').doc(targetUid).update({
          muted: true,
          mutedReason: muteReason,
          mutedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        await db.collection('auditLogs').add({
          action: 'user.mute',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'user',
          targetId: targetUid,
          targetLabel: targetData.username || targetData.email || targetUid,
          details: { reason: muteReason },
          severity: 'warning',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true, muted: true, reason: muteReason });
      }

      case 'unmute': {
        if (!hasPermission(auth.role, 'users.mute')) {
          return NextResponse.json({ error: 'Forbidden: cannot unmute users' }, { status: 403 });
        }
        if (!canManageRole(auth.role, targetRole)) {
          return NextResponse.json({ error: 'Cannot unmute users with equal or higher role' }, { status: 403 });
        }
        await db.collection('users').doc(targetUid).update({
          muted: false,
          mutedReason: FieldValue.delete(),
          mutedAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        await db.collection('auditLogs').add({
          action: 'user.unmute',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'user',
          targetId: targetUid,
          targetLabel: targetData.username || targetData.email || targetUid,
          severity: 'info',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true, muted: false });
      }

      case 'resetPassword': {
        if (!hasPermission(auth.role, 'users.write')) {
          return NextResponse.json({ error: 'Forbidden: cannot reset password' }, { status: 403 });
        }
        if (!canManageRole(auth.role, targetRole)) {
          return NextResponse.json({ error: 'Cannot reset password for users with equal or higher role' }, { status: 403 });
        }
        try {
          await getAdminAuth().updateUser(targetUid, { password: data?.newPassword as string | undefined });
        } catch {
          return NextResponse.json({ error: 'Failed to reset password. Ensure a password is provided.' }, { status: 400 });
        }
        await db.collection('auditLogs').add({
          action: 'user.password.reset',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'user',
          targetId: targetUid,
          targetLabel: targetData.username || targetData.email || targetUid,
          severity: 'warning',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true, passwordReset: true });
      }

      case 'forceLogout': {
        if (!hasPermission(auth.role, 'users.write')) {
          return NextResponse.json({ error: 'Forbidden: cannot force logout' }, { status: 403 });
        }
        if (!canManageRole(auth.role, targetRole)) {
          return NextResponse.json({ error: 'Cannot force logout users with equal or higher role' }, { status: 403 });
        }
        try {
          await getAdminAuth().revokeRefreshTokens(targetUid);
        } catch (err) {
          return NextResponse.json({ error: 'Failed to revoke tokens' }, { status: 500 });
        }
        await db.collection('auditLogs').add({
          action: 'user.force.logout',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'user',
          targetId: targetUid,
          targetLabel: targetData.username || targetData.email || targetUid,
          severity: 'warning',
          timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true, forceLogout: true });
      }

      case 'bulk': {
        if (!data?.uids || !Array.isArray(data.uids) || data.uids.length === 0) {
          return NextResponse.json({ error: 'Missing uids array' }, { status: 400 });
        }
        const bulkAction = data.bulkAction as string;
        const allowedBulkActions = ['ban', 'unban', 'updateRole'];
        if (!allowedBulkActions.includes(bulkAction)) {
          return NextResponse.json({ error: `Invalid bulk action: ${bulkAction}` }, { status: 400 });
        }

        const results: { uid: string; success: boolean; error?: string }[] = [];
        const batch = db.batch();
        const now = FieldValue.serverTimestamp();

        for (const uid of data.uids) {
          try {
            if (uid === auth.uid && bulkAction === 'ban') {
              results.push({ uid, success: false, error: 'Cannot ban yourself' });
              continue;
            }

            const targetSnap = await db.collection('users').doc(uid).get();
            if (!targetSnap.exists) {
              results.push({ uid, success: false, error: 'User not found' });
              continue;
            }

            const targetData = targetSnap.data()!;
            const targetRole: AdminRole = targetData.role || 'user';

            if (bulkAction === 'ban') {
              if (!hasPermission(auth.role, 'users.ban')) {
                results.push({ uid, success: false, error: 'Forbidden' });
                continue;
              }
              if (!canManageRole(auth.role, targetRole)) {
                results.push({ uid, success: false, error: 'Cannot ban equal/higher role' });
                continue;
              }
              batch.update(db.collection('users').doc(uid), { banned: true, updatedAt: now });
            } else if (bulkAction === 'unban') {
              if (!hasPermission(auth.role, 'users.ban')) {
                results.push({ uid, success: false, error: 'Forbidden' });
                continue;
              }
              if (!canManageRole(auth.role, targetRole)) {
                results.push({ uid, success: false, error: 'Cannot unban equal/higher role' });
                continue;
              }
              batch.update(db.collection('users').doc(uid), { banned: false, updatedAt: now });
            } else if (bulkAction === 'updateRole') {
              if (!hasPermission(auth.role, 'users.role')) {
                results.push({ uid, success: false, error: 'Forbidden' });
                continue;
              }
              const newRole = data.role as AdminRole;
              if (!newRole || !canManageRole(auth.role, targetRole) || !canManageRole(auth.role, newRole)) {
                results.push({ uid, success: false, error: 'Cannot manage this role' });
                continue;
              }
              batch.update(db.collection('users').doc(uid), {
                role: newRole,
                isAdmin: newRole === 'super_admin' || newRole === 'admin',
                updatedAt: now,
              });
            }
            results.push({ uid, success: true });
          } catch (err: any) {
            results.push({ uid, success: false, error: err.message });
          }
        }

        await batch.commit();

        const succeeded = results.filter(r => r.success).length;
        const auditAction = bulkAction === 'updateRole' ? 'user.bulk.role.change' : bulkAction === 'ban' ? 'user.bulk.ban' : 'user.bulk.unban';
        await db.collection('auditLogs').add({
          action: auditAction,
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'user',
          targetId: `bulk:${data.uids.length}users`,
          targetLabel: `${succeeded}/${data.uids.length} users ${bulkAction}ed`,
          details: { bulkAction, requested: data.uids.length, succeeded, results: data.uids.length <= 20 ? results : undefined },
          severity: 'warning',
          timestamp: now,
        });

        return NextResponse.json({ success: true, results, succeeded, failed: data.uids.length - succeeded });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[Admin Users POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
