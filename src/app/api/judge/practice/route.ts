import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { executeTestCases, isLanguageSupported } from '@/services/judge-engine';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import type { CodingLanguage, Verdict } from '@/types';

const ALLOWED_LANGUAGES: CodingLanguage[] = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'];
const MAX_CODE_LENGTH = 100000;

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
    const rateCheck = checkRateLimit(uid, request, { windowMs: 60_000, maxRequests: 12 });
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    const body = await request.json();
    const problemId = body?.problemId;
    const language: CodingLanguage = ALLOWED_LANGUAGES.includes(body?.language) ? body.language : 'python';
    const code = body?.code;

    if (!problemId || typeof problemId !== 'string') {
      return NextResponse.json({ error: 'Missing problemId' }, { status: 400 });
    }
    if (typeof code !== 'string' || code.length === 0) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }
    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json({ error: 'Code too long' }, { status: 400 });
    }
    if (!isLanguageSupported(language)) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    const db = getAdminFirestore();

    // Authoritative test cases live server-side; the client never supplies them.
    const [metaSnap, userSnap, secretsSnap, contentSnap] = await Promise.all([
      db.collection('problems').doc(problemId).get(),
      db.collection('users').doc(uid).get(),
      db.collection('problemSecrets').doc(problemId).get().catch(() => null),
      db.collection('problemContent').doc(problemId).get(),
    ]);

    const source = (secretsSnap?.exists && (secretsSnap.data()?.testCases as any)?.length > 0)
      ? secretsSnap.data()!
      : contentSnap.exists ? contentSnap.data()! : null;
    if (userSnap.exists && userSnap.data()?.banned === true) {
      return NextResponse.json({ error: 'Account banned' }, { status: 403 });
    }
    const rawTestCases: Array<{ input?: string; expected?: string; isHidden?: boolean }> =
      (source?.testCases as any) || [];
    if (rawTestCases.length === 0) {
      return NextResponse.json({ error: 'Problem has no test cases' }, { status: 400 });
    }

    const meta = metaSnap.data() || {};

    const judgeResult = await executeTestCases(
      code,
      language,
      rawTestCases.map(tc => ({
        input: String(tc.input ?? ''),
        expected: String(tc.expected ?? ''),
        isHidden: !!tc.isHidden,
      })),
      Math.max(500, Math.min(Number(meta.timeLimitMs) || 2000, 15000)),
      Math.max(64000, Math.min(Number(meta.memoryLimitKb) || 256000, 1024000)),
      problemId,
    );

    const { verdict, passedTestCases, totalTestCases, testCaseResults } = judgeResult;
    const accepted = verdict === 'Accepted';
    const nowIso = new Date().toISOString();

    // ---- Server-side verdict + stats (Admin SDK; not spoofable by clients) ----
    const submissionRef = db.collection('users').doc(uid).collection('submissions').doc();
    const submissionData = {
      userId: uid, problemId, language, code,
      verdict, passedTestCases, totalTestCases,
      executionTimeMs: judgeResult.executionTimeMs,
      memoryUsedKb: judgeResult.memoryUsedKb,
      compileTimeMs: judgeResult.compileTimeMs ?? null,
      codeSize: judgeResult.codeSize ?? null,
      submittedAt: FieldValue.serverTimestamp(),
    };
    submissionRef.set(submissionData);

    const result = await db.runTransaction(async (tx) => {
      const [ppSnap, progSnap, userSnapTx] = await Promise.all([
        tx.get(db.collection('users').doc(uid).collection('practiceProgress').doc(problemId)),
        tx.get(db.collection('users').doc(uid).collection('progress').doc(problemId)),
        tx.get(db.collection('users').doc(uid)),
      ]);

      const alreadySolved = (ppSnap.exists && ppSnap.data()?.solved === true)
        || (progSnap.exists && progSnap.data()?.solved === true);

      const baseProgress = {
        userId: uid,
        problemId,
        solved: alreadySolved || accepted,
        attempted: true,
        bestSubmissionId: submissionRef.id,
        submissionsCount: FieldValue.increment(1),
        lastSubmittedAt: FieldValue.serverTimestamp(),
        lastVerdict: verdict as Verdict,
      };

      tx.set(db.collection('users').doc(uid).collection('practiceProgress').doc(problemId), baseProgress, { merge: true });
      tx.set(db.collection('users').doc(uid).collection('progress').doc(problemId), baseProgress, { merge: true });

      if (userSnapTx.exists) {
        tx.update(db.collection('users').doc(uid), {
          xp: FieldValue.increment(accepted && !alreadySolved ? 50 : accepted ? 15 : 10),
          totalSubmissions: FieldValue.increment(1),
          ...(accepted && !alreadySolved ? { problemsSolved: FieldValue.increment(1) } : {}),
          lastActive: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      return { alreadySolved };
    });

    const submission = {
      id: submissionRef.id,
      userId: uid,
      problemId,
      language,
      code,
      verdict,
      passedTestCases,
      totalTestCases,
      executionTimeMs: judgeResult.executionTimeMs,
      memoryUsedKb: judgeResult.memoryUsedKb,
      submittedAt: nowIso,
    };

    // Judge-engine already masks hidden cases' input/expected/actual — return as-is.
    return NextResponse.json({
      submission,
      results: testCaseResults,
      compileTimeMs: judgeResult.compileTimeMs,
      codeSize: judgeResult.codeSize,
    });
  } catch (err: any) {
    console.error('[Practice Judge] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
