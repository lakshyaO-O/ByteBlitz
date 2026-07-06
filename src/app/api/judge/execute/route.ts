import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { executeTestCases, isLanguageSupported } from '@/services/judge-engine';
import type { CodingLanguage, TestCaseResult, Verdict } from '@/types';

interface JudgeRequest {
  code: string;
  language: CodingLanguage;
  testCases: Array<{ input: string; expected: string; isHidden?: boolean }>;
  timeLimitMs?: number;
  memoryLimitKb?: number;
  problemId?: string;
}

const MAX_CODE_LENGTH = 100000;
const MAX_TEST_CASES = 100;
const DEFAULT_TIME_LIMIT_MS = 5000;
const DEFAULT_MEMORY_LIMIT_KB = 512000;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.JUDGE_RATE_LIMIT || '10', 10);
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(uid: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(uid);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(uid, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }
  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

// Periodically clean stale rate limit entries to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS * 2;
    for (const [uid, entry] of rateLimitMap) {
      if (entry.windowStart < cutoff) rateLimitMap.delete(uid);
    }
  }, RATE_LIMIT_WINDOW_MS);
}

async function resolveHiddenFlags(problemId: string | undefined, clientTestCases: Array<{ isHidden?: boolean }>): Promise<boolean[]> {
  if (problemId) {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection('problemContent').doc(problemId).get();
      if (snap.exists) {
        const data = snap.data();
        if (data?.testCases && Array.isArray(data.testCases) && data.testCases.length >= clientTestCases.length) {
          return (data.testCases as Array<{ isHidden?: boolean }>).map(tc => tc.isHidden ?? false);
        }
      }
    } catch {
      // Fall through to client-provided flags
    }
  }
  return clientTestCases.map(tc => tc.isHidden ?? false);
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

    const { allowed, retryAfterMs } = checkRateLimit(uid);
    if (!allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 1000)} seconds.` },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } },
      );
    }

    const body: JudgeRequest = await request.json();
    const { code, language, testCases, timeLimitMs, memoryLimitKb, problemId } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid code' }, { status: 400 });
    }

    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json({ error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters` }, { status: 400 });
    }

    if (!language || !isLanguageSupported(language)) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json({ error: 'No test cases provided' }, { status: 400 });
    }

    if (testCases.length > MAX_TEST_CASES) {
      return NextResponse.json({ error: `Maximum ${MAX_TEST_CASES} test cases allowed` }, { status: 400 });
    }

    for (const tc of testCases) {
      if (!tc.input || typeof tc.input !== 'string') {
        return NextResponse.json({ error: 'Each test case must have an input string' }, { status: 400 });
      }
    }

    const hiddenFlags = await resolveHiddenFlags(problemId, testCases);

    const result = await executeTestCases(
      code,
      language,
      testCases,
      timeLimitMs || DEFAULT_TIME_LIMIT_MS,
      memoryLimitKb || DEFAULT_MEMORY_LIMIT_KB,
      problemId,
    );

    const sanitizedResults: TestCaseResult[] = result.testCaseResults.map((tc, i) => {
      if (hiddenFlags[i]) {
        return {
          ...tc,
          input: '',
          expectedOutput: '',
          actualOutput: '',
          stdout: '',
          consoleOutput: '',
        };
      }
      return tc;
    });

    return NextResponse.json({
      ...result,
      testCaseResults: sanitizedResults,
    });

  } catch (err: any) {
    console.error('[Judge Execute] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
