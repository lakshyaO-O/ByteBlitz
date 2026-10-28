import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { executeBattleCode } from '@/services/judge-engine';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { calculateElo } from '@/lib/utils';

const ALLOWED_LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'];

interface TestCase {
  input?: string;
  expected?: any;
  isHidden?: boolean;
  [key: string]: any;
}

function convertBattleTestCases(testCases: TestCase[]): Array<{ input: string; expected: string }> {
  return testCases.map((tc) => {
    if (tc.input !== undefined && tc.expected !== undefined) {
      return { input: String(tc.input), expected: String(tc.expected) };
    }
    const entries = Object.entries(tc).filter(([k]) => k !== 'expected');
    const inputStr = entries.map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(', ');
    return { input: inputStr, expected: String(tc.expected) };
  });
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
    const rateCheck = checkRateLimit(uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    const body = await request.json();
    const { battleId, code } = body;

    if (!battleId || typeof battleId !== 'string' || typeof code !== 'string' || code.length === 0) {
      return NextResponse.json({ error: 'Missing battleId or code' }, { status: 400 });
    }
    if (code.length > 50000) {
      return NextResponse.json({ error: 'Code too long' }, { status: 400 });
    }
    const language: string = ALLOWED_LANGUAGES.includes(body.language) ? body.language : 'python';

    const db = getAdminFirestore();
    const battleRef = db.collection('battles').doc(battleId);
    const battleSnap = await battleRef.get();

    if (!battleSnap.exists) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
    }

    const battleData = battleSnap.data()!;

    if (battleData.finished) {
      return NextResponse.json({ error: 'Battle already ended' }, { status: 409 });
    }

    if (battleData.phase !== 'coding') {
      return NextResponse.json({ error: 'Battle is not in the coding phase' }, { status: 409 });
    }

    const isPlayer1 = battleData.player1?.userId === uid;
    const isPlayer2 = battleData.player2?.userId === uid;

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const playerKey = isPlayer1 ? 'player1' : 'player2';
    const enemyKey = isPlayer1 ? 'player2' : 'player1';

    if (battleData[playerKey]?.submitted) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
    }

    const problem = battleData.problem;
    if (!problem?.id) {
      return NextResponse.json({ error: 'Invalid battle problem' }, { status: 400 });
    }

    // Fetch the full (hidden) test cases server-side from problemContent.
    let testCases: Array<{ input: string; expected: string }> = [];
    const contentSnap = await db.collection('problemContent').doc(problem.id).get();
    const rawCases = contentSnap.exists
      ? (contentSnap.data()!.testCases as TestCase[] | undefined) || []
      : (problem.testCases as TestCase[] | undefined) || [];
    if (rawCases.length === 0 && Array.isArray(problem.visibleTests)) {
      rawCases.push(...problem.visibleTests);
    }
    if (rawCases.length === 0) {
      return NextResponse.json({ error: 'Problem has no test cases' }, { status: 500 });
    }
    testCases = convertBattleTestCases(rawCases);

    // Judge OUTSIDE the transaction: no I/O allowed inside runTransaction.
    const { passed, total } = await executeBattleCode(
      code,
      language as any,
      problem.id,
      testCases,
      5000,
      512000,
    );
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;

    const startedAt: any = battleData.codingStartedAt;
    const totalMs: number = battleData.totalTimeMs || 5 * 60 * 1000;
    const startedMs = startedAt?.toMillis ? startedAt.toMillis() : startedAt ? new Date(startedAt).getTime() : 0;
    const clockExpired = startedMs > 0 && Date.now() >= startedMs + totalMs;

    const p1 = battleData.player1 || {};
    const p2 = battleData.player2 || {};
    const me = battleData[playerKey];
    const enemy = battleData[enemyKey];
    const nowIso = new Date().toISOString();

    const outcome = await db.runTransaction(async (transaction) => {
      const freshSnap = await transaction.get(battleRef);
      const fresh = freshSnap.data();

      if (!fresh) throw new Error('Battle vanished during submission');
      if (fresh.finished || fresh.phase === 'finished' || fresh.status === 'finished') {
        return { alreadyEnded: true as const };
      }
      if (fresh[playerKey]?.submitted) {
        return { duplicate: true as const };
      }

      const enemyScoreFresh = fresh[enemyKey]?.score || 0;
      const enemySubmittedFresh = !!fresh[enemyKey]?.submitted;
      const shouldFinalize = enemySubmittedFresh || clockExpired;

      if (!shouldFinalize) {
        transaction.update(battleRef, {
          [`${playerKey}.score`]: score,
          [`${playerKey}.submitted`]: true,
          [`${playerKey}.code`]: code,
          [`${playerKey}.language`]: language,
          [`${playerKey}.passedTestCases`]: passed,
          [`${playerKey}.totalTestCases`]: total,
          [`${playerKey}.submissionCount`]: FieldValue.increment(1),
          [`${playerKey}.lastSubmittedAt`]: nowIso,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return { finalized: false as const };
      }

      // Finalize: competing submissions and no-rematch-in-flight guaranteed by txn.
      const rated = fresh.rated !== false && fresh.matchType !== 'quick';

      const myResult: 'win' | 'loss' | 'draw' = enemySubmittedFresh
        ? (score > enemyScoreFresh ? 'win' : enemyScoreFresh > score ? 'loss' : 'draw')
        : (score > 0 ? 'win' : 'draw'); // enemy never submitted (or timed out)
      const enemyResult: 'win' | 'loss' | 'draw' =
        myResult === 'win' ? 'loss' : myResult === 'loss' ? 'win' : 'draw';
      const winnerIds =
        myResult === 'win'
          ? [uid]
          : enemySubmittedFresh && enemyResult === 'win'
            ? [fresh[enemyKey].userId]
            : [];

      const p1Score = playerKey === 'player1' ? score : enemyScoreFresh;
      const p2Score = playerKey === 'player2' ? score : enemyScoreFresh;

      const p1New = rated ? calculateElo(p1.rating || 800, p2.rating || 800, p1Score > p2Score ? 1 : p1Score === p2Score ? 0.5 : 0) : p1.rating || 800;
      const p2New = rated ? calculateElo(p2.rating || 800, p1.rating || 800, p2Score > p1Score ? 1 : p2Score === p1Score ? 0.5 : 0) : p2.rating || 800;
      const p1Change = p1New - (p1.rating || 800);
      const p2Change = p2New - (p2.rating || 800);

      const startedFinal = fresh.codingStartedAt?.toMillis
        ? fresh.codingStartedAt.toMillis()
        : fresh.codingStartedAt ? new Date(fresh.codingStartedAt).getTime() : 0;
      const durationSec = startedFinal > 0 ? Math.max(0, Math.round((Date.now() - startedFinal) / 1000)) : 0;

      transaction.update(battleRef, {
        [`${playerKey}.score`]: score,
        [`${playerKey}.submitted`]: true,
        [`${playerKey}.code`]: code,
        [`${playerKey}.language`]: language,
        [`${playerKey}.passedTestCases`]: passed,
        [`${playerKey}.totalTestCases`]: total,
        [`${playerKey}.submissionCount`]: FieldValue.increment(1),
        [`${playerKey}.lastSubmittedAt`]: nowIso,
        [`${playerKey}.result`]: myResult,
        [`${playerKey}.eloChange`]: p1Key(playerKey) ? p1Change : p2Change,
        [`${playerKey}.finishedAt`]: nowIso,
        [`${enemyKey}.result`]: enemyResult,
        [`${enemyKey}.eloChange`]: p1Key(playerKey) ? p2Change : p1Change,
        [`${enemyKey}.finishedAt`]: nowIso,
        [`${enemyKey}.totalTestCases`]: fresh[enemyKey]?.totalTestCases || 0,
        status: 'finished',
        phase: 'finished',
        finished: true,
        finishedAt: nowIso,
        winnerIds,
        durationSec,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { finalized: true as const, myResult, eloChange: p1Key(playerKey) ? p1Change : p2Change };
    });
    function p1Key(key: string) { return key === 'player1'; }

    if ('alreadyEnded' in outcome) {
      return NextResponse.json({ success: true, alreadyEnded: true, score, passed, total, result: null });
    }
    if ('duplicate' in outcome) {
      return NextResponse.json({ success: true, duplicate: true, result: null });
    }

    if (!outcome.finalized) {
      // Clean up own matchmaking entry so we can't be matched while mid-battle.
      await db.collection('matchmaking').doc(uid).delete().catch(() => {});
      return NextResponse.json({ success: true, score, passed, total, result: null });
    }

    // ---- Post-finalization: users, matches, history (offset by txn result) ----
    const myResult = outcome.myResult;
    const enemyResult: 'WIN' | 'LOSS' | 'DRAW' =
      myResult === 'win' ? 'LOSS' : myResult === 'loss' ? 'WIN' : 'DRAW';
    const myResultU: 'WIN' | 'LOSS' | 'DRAW' =
      myResult === 'win' ? 'WIN' : myResult === 'loss' ? 'LOSS' : 'DRAW';
    const ratedBattle = battleData.rated !== false && battleData.matchType !== 'quick';
    const durationSec = Math.max(0, Math.round(
      (Date.now() - (startedMs || Date.now())) / 1000,
    ));

    const batch = db.batch();

    batch.update(db.collection('users').doc(uid), {
      ...(ratedBattle ? { rating: FieldValue.increment(outcome.eloChange) } : {}),
      wins: FieldValue.increment(myResult === 'win' ? 1 : 0),
      losses: FieldValue.increment(myResult === 'loss' ? 1 : 0),
      draws: FieldValue.increment(myResult === 'draw' ? 1 : 0),
      xp: FieldValue.increment(Math.max(10, Math.floor(score / 2))),
      updatedAt: nowIso,
    });

    const enemyUserId: string = enemy?.userId || (p1Key(playerKey) ? p2.userId : p1.userId);
    batch.update(db.collection('users').doc(enemyUserId), {
      ...(ratedBattle ? { rating: FieldValue.increment(-outcome.eloChange) } : {}),
      wins: FieldValue.increment(enemyResult === 'WIN' ? 1 : 0),
      losses: FieldValue.increment(enemyResult === 'LOSS' ? 1 : 0),
      draws: FieldValue.increment(enemyResult === 'DRAW' ? 1 : 0),
      xp: FieldValue.increment(Math.max(10, Math.floor((enemy?.score || score) / 2))),
      updatedAt: nowIso,
    });

    const matchRef = db.collection('matches').doc();
    batch.set(matchRef, {
      players: [
        { uid, username: me.username || 'Player', score, result: myResultU, eloChange: outcome.eloChange },
        { uid: enemyUserId, username: enemy?.username || 'Player', score: enemy?.score || 0, result: enemyResult, eloChange: -outcome.eloChange },
      ],
      winnerIds: myResult === 'draw' ? [] : [myResult === 'win' ? uid : enemyUserId],
      problem: { id: problem.id, title: problem.title },
      rated: ratedBattle,
      duration: durationSec,
      gameMode: battleData.matchType || 'rated',
      timestamp: nowIso,
    });

    batch.set(db.collection('users').doc(uid).collection('gameHistory').doc(), {
      matchId: battleId,
      opponentId: enemyUserId,
      opponentName: enemy?.username || 'Player',
      result: myResultU,
      yourScore: score,
      opponentScore: enemy?.score || 0,
      timeUsed: durationSec,
      problem: { id: problem.id, title: problem.title },
      timestamp: nowIso,
    });
    batch.set(db.collection('users').doc(enemyUserId).collection('gameHistory').doc(), {
      matchId: battleId,
      opponentId: uid,
      opponentName: me.username || 'Player',
      result: enemyResult,
      yourScore: enemy?.score || 0,
      opponentScore: score,
      timeUsed: durationSec,
      problem: { id: problem.id, title: problem.title },
      timestamp: nowIso,
    });

    // fetchMatchHistory reads users/{uid}/matches
    batch.set(db.collection('users').doc(uid).collection('matches').doc(battleId), {
      battleId,
      opponentId: enemyUserId,
      opponentName: enemy?.username || 'Player',
      opponentRating: enemy?.rating || 800,
      result: myResultU,
      eloChange: outcome.eloChange,
      yourScore: score,
      opponentScore: enemy?.score || 0,
      problem: { id: problem.id, title: problem.title },
      rated: ratedBattle,
      timestamp: nowIso,
    });
    batch.set(db.collection('users').doc(enemyUserId).collection('matches').doc(battleId), {
      battleId,
      opponentId: uid,
      opponentName: me.username || 'Player',
      opponentRating: me.rating || 800,
      result: enemyResult,
      eloChange: -outcome.eloChange,
      yourScore: enemy?.score || 0,
      opponentScore: score,
      problem: { id: problem.id, title: problem.title },
      rated: ratedBattle,
      timestamp: nowIso,
    });

    await batch.commit();

    // Both matchmaking docs are now zombie "matched" entries; clean them up.
    await db.collection('matchmaking').doc(uid).delete().catch(() => {});
    if (enemyUserId) await db.collection('matchmaking').doc(enemyUserId).delete().catch(() => {});

    return NextResponse.json({
      success: true,
      score,
      passed,
      total,
      result: myResultU,
      eloChange: outcome.eloChange,
    });
  } catch (err: any) {
    console.error('[Battle Submit] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
