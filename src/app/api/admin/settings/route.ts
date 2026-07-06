import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AdminRole } from '@/types/admin';
import { hasPermission, ROLE_PERMISSIONS } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { settingsUpdateSchema } from '@/lib/validation';

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

const MASKED_FIELDS = new Set([
  'FIREBASE_PRIVATE_KEY', 'JUDGE0_API_KEY', 'GEMINI_API_KEY',
  'NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_CLIENT_EMAIL',
]);

function maskValue(key: string, value: string | undefined): string {
  if (!value) return '';
  if (MASKED_FIELDS.has(key)) {
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '••••' + value.slice(-4);
  }
  return value;
}

const DANGER_SECTIONS = new Set(['maintenance', 'judge', 'apiKeys', 'danger']);

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAndGetRole(request);
    if (isErrorResponse(auth)) return auth;

    const rateCheck = checkRateLimit(auth.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    if (!hasPermission(auth.role, 'settings.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminFirestore();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'all';

    if (section === 'environment') {
      const envVars = {
        PISTON_API_URL: process.env.PISTON_API_URL ? 'configured' : 'not set',
        JUDGE0_API_URL: process.env.JUDGE0_API_URL ? 'configured' : 'not set',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? maskValue('GEMINI_API_KEY', process.env.GEMINI_API_KEY) : 'not set',
        JUDGE0_API_KEY: process.env.JUDGE0_API_KEY ? maskValue('JUDGE0_API_KEY', process.env.JUDGE0_API_KEY) : 'not set',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? maskValue('FIREBASE_CLIENT_EMAIL', process.env.FIREBASE_CLIENT_EMAIL) : 'not set',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'not set',
        JUDGE_RATE_LIMIT: process.env.JUDGE_RATE_LIMIT || '10',
        NODE_ENV: process.env.NODE_ENV || 'development',
        VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
      };
      return NextResponse.json({ environment: envVars });
    }

    if (section === 'apiKeys') {
      const apiKeys = {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? maskValue('GEMINI_API_KEY', process.env.GEMINI_API_KEY) : 'not set',
        JUDGE0_API_KEY: process.env.JUDGE0_API_KEY ? maskValue('JUDGE0_API_KEY', process.env.JUDGE0_API_KEY) : 'not set',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? maskValue('FIREBASE_PRIVATE_KEY', process.env.FIREBASE_PRIVATE_KEY) : 'not set',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? maskValue('FIREBASE_CLIENT_EMAIL', process.env.FIREBASE_CLIENT_EMAIL) : 'not set',
      };
      return NextResponse.json({ apiKeys });
    }

    if (section === 'all') {
      const sections = ['featureFlags', 'settings', 'judge', 'maintenance', 'aiQuotas', 'notifications', 'rateLimits'];
      const snapshots = await Promise.all(sections.map(s => db.collection('config').doc(s).get()));
      const result: Record<string, unknown> = {};
      snapshots.forEach((snap, i) => {
        result[sections[i]] = snap.exists ? snap.data() : null;
      });
      result.roles = ROLE_PERMISSIONS;
      return NextResponse.json(result);
    }

    const snap = await db.collection('config').doc(section).get();
    return NextResponse.json({ [section]: snap.exists ? snap.data() : null });
  } catch (err: any) {
    console.error('[Admin Settings GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid request' }, { status: 400 });
    }
    const { section, data } = parsed.data;

    if (!hasPermission(auth.role, DANGER_SECTIONS.has(section) ? 'admin.manage' : 'settings.write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const docRef = db.collection('config').doc(section);
    const prevSnap = await docRef.get();
    const prev = prevSnap.exists ? prevSnap.data() : {};

    if (section === 'danger') {
      const action = data._action;
      const auditLog: Record<string, any> = {
        action: 'settings.update',
        performedBy: auth.uid,
        performedByEmail: auth.email,
        performedByRole: auth.role,
        targetType: 'setting',
        targetId: `danger.${action}`,
        targetLabel: `Danger Action: ${action}`,
        previousState: {},
        newState: { action },
        severity: 'critical',
        timestamp: FieldValue.serverTimestamp(),
      };

      switch (action) {
        case 'resetAiUsage': {
          const usersSnap = await db.collection('users').get();
          const batch = db.batch();
          usersSnap.docs.forEach(d => {
            batch.update(d.ref, { aiUsage: {}, aiUsageResetAt: FieldValue.serverTimestamp() });
          });
          await batch.commit();
          auditLog.details = { usersAffected: usersSnap.size };
          break;
        }
        case 'clearAuditLogs': {
          const logsSnap = await db.collection('auditLogs').get();
          const batch = db.batch();
          logsSnap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
          auditLog.details = { logsDeleted: logsSnap.size };
          break;
        }
        case 'resetAllSettings': {
          const sections = ['featureFlags', 'judge', 'maintenance', 'aiQuotas', 'notifications', 'rateLimits', 'settings', 'roles'];
          const batch = db.batch();
          sections.forEach(s => {
            batch.set(db.collection('config').doc(s), {}, { merge: false });
          });
          await batch.commit();
          auditLog.details = { sectionsReset: sections };
          break;
        }
        default:
          return NextResponse.json({ error: `Unknown danger action: ${action}` }, { status: 400 });
      }

      await db.collection('auditLogs').add(auditLog);
      return NextResponse.json({ success: true });
    }

    if (section === 'apiKeys') {
      const auditLog: Record<string, any> = {
        action: 'settings.update',
        performedBy: auth.uid,
        performedByEmail: auth.email,
        performedByRole: auth.role,
        targetType: 'setting',
        targetId: 'apiKeys',
        targetLabel: 'API Keys Regenerated',
        details: { action: 'regenerateAll' },
        previousState: {},
        newState: { regenerated: true },
        severity: 'critical',
        timestamp: FieldValue.serverTimestamp(),
      };
      await db.collection('auditLogs').add(auditLog);
      return NextResponse.json({ success: true });
    }

    await docRef.set(data, { merge: true });

    await db.collection('auditLogs').add({
      action: 'settings.update',
      performedBy: auth.uid,
      performedByEmail: auth.email,
      performedByRole: auth.role,
      targetType: 'setting',
      targetId: section,
      targetLabel: section,
      previousState: { ...prev },
      newState: { ...data },
      severity: DANGER_SECTIONS.has(section) ? 'warning' : 'info',
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Settings POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
