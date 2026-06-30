import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

interface TestCase {
  [key: string]: any;
  expected: any;
}

function runTests(sourceCode: string, problemId: string, testCases: TestCase[]): { passed: number; total: number } {
  let passed = 0;
  const total = testCases.length;

  const fnName = problemId === 'valid-parentheses' ? 'isValid'
    : problemId === 'two-sum' ? 'twoSum'
    : problemId === 'reverse-string' ? 'reverseString'
    : null;

  if (!fnName || total === 0) return { passed: 0, total };

  try {
    const wrappedCode = `${sourceCode}\nreturn typeof ${fnName} !== 'undefined' ? ${fnName} : undefined;`;
    const runUserCode = new Function(wrappedCode);
    const userFn = runUserCode();

    if (typeof userFn !== 'function') return { passed: 0, total };

    for (const tc of testCases) {
      try {
        const inputs = { ...tc };
        delete inputs.expected;
        const result = userFn(...Object.values(inputs));
        if (JSON.stringify(result) === JSON.stringify(tc.expected)) {
          passed++;
        }
      } catch {
        // Test failed
      }
    }
  } catch {
    // Code compilation failed
  }

  return { passed, total };
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
    const body = await request.json();
    const { battleId, code } = body;

    if (!battleId || typeof code !== 'string') {
      return NextResponse.json({ error: 'Missing battleId or code' }, { status: 400 });
    }

    if (code.length > 50000) {
      return NextResponse.json({ error: 'Code too long' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const battleRef = db.collection('battles').doc(battleId);
    const battleSnap = await battleRef.get();

    if (!battleSnap.exists) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
    }

    const battleData = battleSnap.data()!;

    if (battleData.finished) {
      return NextResponse.json({ error: 'Battle already ended' }, { status: 400 });
    }

    const isPlayer1 = battleData.player1?.uid === uid;
    const isPlayer2 = battleData.player2?.uid === uid;

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const playerKey = isPlayer1 ? 'player1' : 'player2';
    const enemyKey = isPlayer1 ? 'player2' : 'player1';

    const problem = battleData.problem;
    if (!problem || !problem.testCases) {
      return NextResponse.json({ error: 'Invalid battle problem' }, { status: 400 });
    }

    const { passed, total } = runTests(code, problem.id, problem.testCases);
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;

    const writeData: Record<string, any> = {
      [`${playerKey}.score`]: score,
      [`${playerKey}.submitted`]: true,
      [`${playerKey}.code`]: code,
    };

    const enemyData = battleData[enemyKey];
    const enemySubmitted = enemyData?.submitted;
    const enemyScore = enemyData?.score || 0;

    let result: 'WIN' | 'LOSS' | 'DRAW' | null = null;
    let winnerIds: string[] = [];
    let eloChange = 0;

    if (enemySubmitted) {
      if (score > enemyScore) {
        result = 'WIN';
        winnerIds = [uid];
        eloChange = 25;
      } else if (enemyScore > score) {
        result = 'LOSS';
        winnerIds = [battleData[enemyKey].uid];
        eloChange = -20;
      } else {
        result = 'DRAW';
        winnerIds = [];
        eloChange = 0;
      }

      writeData.status = 'finished';
      writeData.finished = true;
      writeData.finishedAt = new Date().toISOString();
      writeData.winnerIds = winnerIds;
    }

    await battleRef.update(writeData);

    if (result) {
      const matchRef = db.collection('matches').doc();
      await matchRef.set({
        players: [
          { uid, username: battleData[playerKey].username, score, result, eloChange },
          { uid: battleData[enemyKey].uid, username: battleData[enemyKey].username, score: enemyScore, result: result === 'WIN' ? 'LOSS' : result === 'LOSS' ? 'WIN' : 'DRAW', eloChange: -eloChange },
        ],
        winnerIds,
        problem: { id: problem.id, title: problem.title },
        duration: battleData.duration || 1200,
        gameMode: 'rated',
        timestamp: new Date().toISOString(),
      });

      const batch = db.batch();
      batch.update(db.collection('users').doc(uid), {
        rating: FieldValue.increment(eloChange),
        wins: FieldValue.increment(result === 'WIN' ? 1 : 0),
        losses: FieldValue.increment(result === 'LOSS' ? 1 : 0),
        draws: FieldValue.increment(result === 'DRAW' ? 1 : 0),
        xp: FieldValue.increment(Math.max(10, Math.floor(score / 2))),
        updatedAt: new Date().toISOString(),
      });

      batch.update(db.collection('users').doc(battleData[enemyKey].uid), {
        rating: FieldValue.increment(-eloChange),
        wins: FieldValue.increment(result === 'LOSS' ? 1 : 0),
        losses: FieldValue.increment(result === 'WIN' ? 1 : 0),
        draws: FieldValue.increment(result === 'DRAW' ? 1 : 0),
        xp: FieldValue.increment(Math.max(10, Math.floor(enemyScore / 2))),
        updatedAt: new Date().toISOString(),
      });

      const gameHistoryRef = db.collection('users').doc(uid).collection('gameHistory').doc();
      batch.set(gameHistoryRef, {
        matchId: battleId,
        opponentId: battleData[enemyKey].uid,
        opponentName: battleData[enemyKey].username,
        result,
        yourScore: score,
        opponentScore: enemyScore,
        timeUsed: 0,
        opponentTimeUsed: 0,
        problem: { id: problem.id, title: problem.title },
        timestamp: new Date().toISOString(),
      });

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      score,
      passed,
      total,
      result,
      eloChange,
    });
  } catch (err: any) {
    console.error('[Battle Submit] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
