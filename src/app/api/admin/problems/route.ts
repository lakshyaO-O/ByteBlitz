import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AdminRole } from '@/types/admin';
import { hasPermission } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { problemActionSchema } from '@/lib/validation';

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

    if (!hasPermission(auth.role, 'problems.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminFirestore();
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const cursor = searchParams.get('cursor');

    if (problemId) {
      const [metaSnap, contentSnap] = await Promise.all([
        db.collection('problems').doc(problemId).get(),
        db.collection('problemContent').doc(problemId).get(),
      ]);

      if (!metaSnap.exists) {
        return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
      }

      return NextResponse.json({
        meta: { id: metaSnap.id, ...metaSnap.data() },
        content: contentSnap.exists ? contentSnap.data() : null,
      });
    }

    let query: FirebaseFirestore.Query = db.collection('problems').orderBy('title', 'asc').limit(limit);
    if (cursor) {
      const cursorSnap = await db.collection('problems').doc(cursor).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    const snapshot = await query.get();
    const problems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const nextCursor = snapshot.docs[snapshot.docs.length - 1]?.id || null;

    return NextResponse.json({ problems, total: null, nextCursor, limit });
  } catch (err: any) {
    console.error('[Admin Problems GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAndGetRole(request);
    if (isErrorResponse(auth)) return auth;

    const rateCheck = checkRateLimit(auth.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    const db = getAdminFirestore();
    const body = await request.json();
    const parsed = problemActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid request' }, { status: 400 });
    }
    const { action, problemId, data } = parsed.data;

    const getLabel = (snap: FirebaseFirestore.DocumentSnapshot) =>
      (snap.exists ? (snap.data() as any).title : null) || problemId || 'Untitled';

    switch (action) {
      case 'create': {
        if (!hasPermission(auth.role, 'problems.write')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const ref = await db.collection('problems').add({
          title: data?.title || 'Untitled',
          difficulty: data?.difficulty || 'Easy',
          category: data?.category || '',
          points: data?.points || 100,
          topics: data?.topics || [],
          companyTags: data?.companyTags || [],
          isPublished: false,
          isPremium: data?.isPremium || false,
          isArchived: false,
          estimatedTime: data?.estimatedTime || 15,
          difficultyRating: data?.difficultyRating || 1,
          prerequisites: data?.prerequisites || [],
          relatedProblems: data?.relatedProblems || [],
          totalSubmissions: 0,
          totalAccepted: 0,
          acceptanceRate: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        await db.collection('problemContent').doc(ref.id).set({
          description: data?.description || '',
          constraints: data?.constraints || [],
          examples: data?.examples || [],
          testCases: data?.testCases || [],
          hints: data?.hints || [],
          editorial: data?.editorial || '',
          solutionCode: data?.solutionCode || {},
          starterCode: data?.starterCode || {},
          timeLimitMs: data?.timeLimitMs ?? 2000,
          memoryLimitKb: data?.memoryLimitKb ?? 256000,
        });

        await db.collection('auditLogs').add({
          action: 'problem.create',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'problem',
          targetId: ref.id,
          targetLabel: data?.title || ref.id,
          severity: 'info',
          timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, id: ref.id });
      }

      case 'saveContent': {
        if (!hasPermission(auth.role, 'problems.write')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!problemId) {
          return NextResponse.json({ error: 'Missing problemId' }, { status: 400 });
        }

        const metaSnap = await db.collection('problems').doc(problemId).get();
        if (!metaSnap.exists) {
          return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
        }

        const currentContentSnap = await db.collection('problemContent').doc(problemId).get();
        const currentContent = currentContentSnap.exists ? currentContentSnap.data() : {};

        const versionId = Date.now().toString();
        await db.collection('problems').doc(problemId).collection('versions').doc(versionId).set({
          snapshot: currentContent,
          savedAt: FieldValue.serverTimestamp(),
          savedBy: auth.uid,
          savedByEmail: auth.email,
        });

        const metaUpdate: Record<string, unknown> = {};
        if (data?.title !== undefined) metaUpdate.title = data.title;
        if (data?.difficulty !== undefined) metaUpdate.difficulty = data.difficulty;
        if (data?.category !== undefined) metaUpdate.category = data.category;
        if (data?.points !== undefined) metaUpdate.points = data.points;
        if (data?.topics !== undefined) metaUpdate.topics = data.topics;
        if (data?.companyTags !== undefined) metaUpdate.companyTags = data.companyTags;
        if (data?.isPremium !== undefined) metaUpdate.isPremium = data.isPremium;
        if (data?.estimatedTime !== undefined) metaUpdate.estimatedTime = data.estimatedTime;
        if (data?.prerequisites !== undefined) metaUpdate.prerequisites = data.prerequisites;
        if (data?.difficultyRating !== undefined) metaUpdate.difficultyRating = data.difficultyRating;
        metaUpdate.updatedAt = FieldValue.serverTimestamp();

        await db.collection('problems').doc(problemId).update(metaUpdate);

        const contentUpdate: Record<string, unknown> = {};
        if (data?.description !== undefined) contentUpdate.description = data.description;
        if (data?.constraints !== undefined) contentUpdate.constraints = data.constraints;
        if (data?.examples !== undefined) contentUpdate.examples = data.examples;
        if (data?.testCases !== undefined) contentUpdate.testCases = data.testCases;
        if (data?.hints !== undefined) contentUpdate.hints = data.hints;
        if (data?.editorial !== undefined) contentUpdate.editorial = data.editorial;
        if (data?.solutionCode !== undefined) contentUpdate.solutionCode = data.solutionCode;
        if (data?.starterCode !== undefined) contentUpdate.starterCode = data.starterCode;
        if (data?.timeLimitMs !== undefined) contentUpdate.timeLimitMs = data.timeLimitMs;
        if (data?.memoryLimitKb !== undefined) contentUpdate.memoryLimitKb = data.memoryLimitKb;

        if (Object.keys(contentUpdate).length > 0) {
          await db.collection('problemContent').doc(problemId).set(contentUpdate, { merge: true });
        }

        await db.collection('auditLogs').add({
          action: 'problem.update',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'problem',
          targetId: problemId,
          targetLabel: (metaSnap.data() as any).title || problemId,
          details: { versionId, updatedFields: Object.keys({ ...metaUpdate, ...contentUpdate }) },
          severity: 'info',
          timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, versionId });
      }

      case 'delete': {
        if (!hasPermission(auth.role, 'problems.delete')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!problemId) {
          return NextResponse.json({ error: 'Missing problemId' }, { status: 400 });
        }

        const delSnap = await db.collection('problems').doc(problemId).get();
        const delLabel = getLabel(delSnap);

        const versionsSnap = await db.collection('problems').doc(problemId).collection('versions').get();
        const batch = db.batch();
        versionsSnap.docs.forEach(v => batch.delete(v.ref));
        batch.delete(delSnap.ref);
        try { batch.delete(db.collection('problemContent').doc(problemId)); } catch {}
        try { await db.collection('problemContent').doc(problemId).delete(); } catch {}
        await batch.commit();

        await db.collection('auditLogs').add({
          action: 'problem.delete',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'problem',
          targetId: problemId,
          targetLabel: delLabel,
          severity: 'warning',
          timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true });
      }

      case 'togglePublish': {
        if (!hasPermission(auth.role, 'problems.publish')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!problemId) {
          return NextResponse.json({ error: 'Missing problemId' }, { status: 400 });
        }

        const pubSnap = await db.collection('problems').doc(problemId).get();
        if (!pubSnap.exists) {
          return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
        }

        const currentPublished = pubSnap.data()!.isPublished !== false;
        await db.collection('problems').doc(problemId).update({
          isPublished: !currentPublished,
          updatedAt: FieldValue.serverTimestamp(),
        });

        await db.collection('auditLogs').add({
          action: currentPublished ? 'problem.unpublish' : 'problem.publish',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'problem',
          targetId: problemId,
          targetLabel: (pubSnap.data() as any).title || problemId,
          severity: 'info',
          timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, isPublished: !currentPublished });
      }

      case 'archive': {
        if (!hasPermission(auth.role, 'problems.write')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!problemId) {
          return NextResponse.json({ error: 'Missing problemId' }, { status: 400 });
        }

        await db.collection('problems').doc(problemId).update({
          isArchived: true,
          updatedAt: FieldValue.serverTimestamp(),
        });

        await db.collection('auditLogs').add({
          action: 'problem.update',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'problem',
          targetId: problemId,
          targetLabel: (await db.collection('problems').doc(problemId).get()).data()?.title || problemId,
          details: { archived: true },
          severity: 'info',
          timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, archived: true });
      }

      case 'restore': {
        if (!hasPermission(auth.role, 'problems.write')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!problemId) {
          return NextResponse.json({ error: 'Missing problemId' }, { status: 400 });
        }

        await db.collection('problems').doc(problemId).update({
          isArchived: false,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, archived: false });
      }

      case 'getVersions': {
        if (!hasPermission(auth.role, 'problems.read')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!problemId) {
          return NextResponse.json({ error: 'Missing problemId' }, { status: 400 });
        }

        const versionsSnap = await db.collection('problems')
          .doc(problemId)
          .collection('versions')
          .orderBy('savedAt', 'desc')
          .limit(50)
          .get();

        const versions = versionsSnap.docs.map(v => ({
          id: v.id,
          ...v.data(),
          savedAt: v.data().savedAt?.toDate?.()?.toISOString() || v.data().savedAt || '',
        }));

        return NextResponse.json({ versions });
      }

      case 'restoreVersion': {
        if (!hasPermission(auth.role, 'problems.write')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!problemId || !data?.versionId) {
          return NextResponse.json({ error: 'Missing problemId or versionId' }, { status: 400 });
        }

        const versionSnap = await db.collection('problems')
          .doc(problemId)
          .collection('versions')
          .doc(data.versionId as string)
          .get();

        if (!versionSnap.exists) {
          return NextResponse.json({ error: 'Version not found' }, { status: 404 });
        }

        const versionData = versionSnap.data()!.snapshot as Record<string, unknown>;
        const currentContentSnap = await db.collection('problemContent').doc(problemId).get();
        const currentContent = currentContentSnap.exists ? currentContentSnap.data() : {};

        const newVersionId = Date.now().toString();
        await db.collection('problems').doc(problemId).collection('versions').doc(newVersionId).set({
          snapshot: currentContent,
          savedAt: FieldValue.serverTimestamp(),
          savedBy: auth.uid,
          savedByEmail: auth.email,
          restoredFrom: data.versionId,
        });

        if (Object.keys(versionData).length > 0) {
          await db.collection('problemContent').doc(problemId).set(versionData, { merge: true });
        }

        await db.collection('auditLogs').add({
          action: 'problem.update',
          performedBy: auth.uid,
          performedByEmail: auth.email,
          performedByRole: auth.role,
          targetType: 'problem',
          targetId: problemId,
          targetLabel: (await db.collection('problems').doc(problemId).get()).data()?.title || problemId,
          details: { restoredFrom: data.versionId },
          severity: 'warning',
          timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, restoredFrom: data.versionId, versionId: newVersionId });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[Admin Problems] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
