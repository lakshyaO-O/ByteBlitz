import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { hasPermission } from '@/types/admin';
import type { AdminRole } from '@/types/admin';

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

async function checkBackend(url: string | undefined, label: string): Promise<{ status: string; latencyMs: number | null; error?: string }> {
  if (!url) {
    return { status: 'not_configured', latencyMs: null };
  }
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal, method: 'GET' });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;
    return { status: res.ok ? 'operational' : 'degraded', latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return { status: 'down', latencyMs, error: err.message || 'Connection failed' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAndGetRole(request);
    if (isErrorResponse(auth)) return auth;

    if (!hasPermission(auth.role, 'analytics.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminFirestore();

    // Health checks
    const pistonUrl = process.env.PISTON_API_URL;
    const judge0Url = process.env.JUDGE0_API_URL;
    const [pistonHealth, judge0Health] = await Promise.all([
      checkBackend(pistonUrl, 'Piston'),
      checkBackend(judge0Url, 'Judge0'),
    ]);

    const backendsHealthy = [pistonHealth, judge0Health].filter(h => h.status === 'operational').length;
    const overallHealth = pistonUrl || judge0Url
      ? (backendsHealthy > 0 ? 'operational' : 'down')
      : 'not_configured';

    // Collection group query across all users/{uid}/submissions
    const subSnap = await db.collectionGroup('submissions')
      .orderBy('submittedAt', 'desc')
      .limit(500)
      .get();

    const submissions = subSnap.docs.map(d => {
      const data = d.data();
      const refPath = d.ref.path;
      const pathParts = refPath.split('/');
      return {
        id: d.id,
        userId: data.userId || (pathParts.length >= 3 ? pathParts[1] : ''),
        username: data.username || '',
        problemId: data.problemId || '',
        problemTitle: data.problemTitle || '',
        language: data.language || 'unknown',
        verdict: data.verdict || 'Pending',
        executionTimeMs: data.executionTimeMs ?? 0,
        memoryUsedKb: data.memoryUsedKb ?? 0,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || data.submittedAt || '',
      };
    });

    // Aggregate stats
    const total = submissions.length;
    const accepted = submissions.filter(s => s.verdict === 'Accepted').length;
    const wrongAnswer = submissions.filter(s => s.verdict === 'Wrong Answer').length;
    const compilationErrors = submissions.filter(s => s.verdict === 'Compilation Error').length;
    const runtimeErrors = submissions.filter(s => s.verdict === 'Runtime Error').length;
    const timeLimitErrors = submissions.filter(s => s.verdict === 'Time Limit Exceeded').length;
    const memoryErrors = submissions.filter(s => s.verdict === 'Memory Limit Exceeded').length;
    const pending = submissions.filter(s => s.verdict === 'Pending').length;
    const failed = submissions.filter(s => s.verdict !== 'Accepted' && s.verdict !== 'Pending').length;

    const totalTime = submissions.reduce((sum, s) => sum + (s.executionTimeMs || 0), 0);
    const avgTime = total > 0 ? Math.round(totalTime / total) : 0;

    const totalMemory = submissions.reduce((sum, s) => sum + (s.memoryUsedKb || 0), 0);
    const avgMemory = total > 0 ? Math.round(totalMemory / total) : 0;

    // Percentiles
    const times = submissions.map(s => s.executionTimeMs || 0).sort((a, b) => a - b);
    const p50 = times.length > 0 ? percentile(times, 0.5) : 0;
    const p95 = times.length > 0 ? percentile(times, 0.95) : 0;
    const p99 = times.length > 0 ? percentile(times, 0.99) : 0;

    // Language breakdown
    const langMap: Record<string, { count: number; accepted: number }> = {};
    submissions.forEach(s => {
      const lang = s.language || 'unknown';
      if (!langMap[lang]) langMap[lang] = { count: 0, accepted: 0 };
      langMap[lang].count++;
      if (s.verdict === 'Accepted') langMap[lang].accepted++;
    });

    const languages = Object.entries(langMap)
      .map(([language, stats]) => ({ language, ...stats }))
      .sort((a, b) => b.count - a.count);

    // 24h window
    const now = Date.now();
    const dayAgo = new Date(now - 86400000).toISOString();
    const last24h = submissions.filter(s => s.submittedAt >= dayAgo);

    // Recent executions (last 50)
    const recentExecutions = submissions.slice(0, 50);

    return NextResponse.json({
      health: {
        status: overallHealth,
        backends: {
          piston: pistonHealth,
          judge0: judge0Health,
        },
      },
      queue: {
        totalQueued: total,
        running: submissions.filter(s => s.verdict === 'Pending').length,
        pending,
      },
      executions: {
        total,
        total24h: last24h.length,
        accepted,
        failed,
        compilationErrors,
        runtimeErrors,
        timeLimitErrors,
        memoryErrors,
        wrongAnswer,
      },
      performance: {
        avgExecutionTimeMs: avgTime,
        avgMemoryUsedKb: avgMemory,
        p50ExecutionTimeMs: p50,
        p95ExecutionTimeMs: p95,
        p99ExecutionTimeMs: p99,
      },
      languages,
      recentExecutions,
    });
  } catch (err: any) {
    console.error('[Judge Monitor] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function percentile(sorted: number[], p: number): number {
  const index = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
