import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';

class TransactionAbortError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'TransactionAbortError';
  }
}

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
    const rateCheck = checkRateLimit(uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    const db = getAdminFirestore();

    const { opponentId, rated, timeControl, language } = await request.json();

    if (!opponentId) {
      return NextResponse.json({ error: 'Missing opponentId' }, { status: 400 });
    }

    const [userSnap, opponentSnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('users').doc(opponentId).get(),
    ]);

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = userSnap.data()!;
    if (userData.banned === true) {
      return NextResponse.json({ error: 'Account banned' }, { status: 403 });
    }

    if (!opponentSnap.exists) {
      return NextResponse.json({ error: 'Opponent not found' }, { status: 404 });
    }
    const opponentData = opponentSnap.data()!;
    if (opponentData.banned === true) {
      return NextResponse.json({ error: 'Opponent is banned' }, { status: 403 });
    }

    const problemsSnap = await db.collection('problems')
      .where('isPublished', '==', true)
      .limit(50)
      .get();

    if (problemsSnap.empty) {
      return NextResponse.json({ error: 'No problems available' }, { status: 500 });
    }

    const problemDocs = problemsSnap.docs;
    const randomProblem = problemDocs[Math.floor(Math.random() * problemDocs.length)];
    const problemMeta: Record<string, any> = { id: randomProblem.id, ...randomProblem.data() };

    const contentSnap = await db.collection('problemContent').doc(randomProblem.id).get();
    if (!contentSnap.exists) {
      return NextResponse.json({ error: 'Problem content not found' }, { status: 500 });
    }
    const problemContent = contentSnap.data()!;

    const totalTimeMs = (() => {
      const match = (timeControl || '5+0').match(/^(\d+)\+(\d+)$/);
      if (!match) return 5 * 60 * 1000;
      return parseInt(match[1], 10) * 60 * 1000;
    })();

    const problemForBattle = {
      id: problemMeta.id,
      title: problemMeta.title,
      difficulty: problemMeta.difficulty || 'Medium',
      category: problemMeta.category || '',
      points: problemMeta.points || 100,
      description: problemContent.description || '',
      constraints: problemContent.constraints || [],
      inputFormat: problemContent.inputFormat || '',
      outputFormat: problemContent.outputFormat || '',
      examples: problemContent.examples || [],
      testCases: (problemContent.testCases || []).map((tc: any) => ({
        input: tc.input,
        expected: tc.expected,
      })),
      tags: problemMeta.tags || [],
      starterCode: problemContent.starterCode || {},
    };

    const player1Ref = db.collection('matchmaking').doc(uid);
    const player2Ref = db.collection('matchmaking').doc(opponentId);

    const battleId = await db.runTransaction(async (transaction) => {
      const p1Snap = await transaction.get(player1Ref);
      const p2Snap = await transaction.get(player2Ref);

      if (!p1Snap.exists || p1Snap.data()?.status !== 'searching') {
        throw new TransactionAbortError('You are not in matchmaking');
      }
      if (!p2Snap.exists || p2Snap.data()?.status !== 'searching') {
        throw new TransactionAbortError('Opponent is no longer available');
      }

      const ref = db.collection('battles').doc();
      transaction.set(ref, {
        player1: {
          uid,
          username: userData.username || 'Player',
          rating: userData.rating || 800,
          score: 0,
          submitted: false,
          code: '',
        },
        player2: {
          uid: opponentId,
          username: opponentData.username || 'Player',
          rating: opponentData.rating || 800,
          score: 0,
          submitted: false,
          code: '',
        },
        problem: {
          id: problemForBattle.id,
          title: problemForBattle.title,
          difficulty: problemForBattle.difficulty,
          description: problemForBattle.description,
          starterCode: problemForBattle.starterCode,
          testCases: problemForBattle.testCases,
        },
        status: 'countdown',
        phase: 'countdown',
        matchType: rated ? 'ranked' : 'quick',
        timeControl: timeControl || '5+0',
        totalTimeMs,
        rated: !!rated,
        countdownStartedAt: new Date().toISOString(),
        codingStartedAt: '',
        roomCode: Array.from({ length: 6 }, () =>
          'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 30)]
        ).join(''),
        winnerIds: [],
        finished: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(player1Ref, { status: 'matched', battleId: ref.id });
      transaction.update(player2Ref, { status: 'matched', battleId: ref.id });

      return ref.id;
    });

    return NextResponse.json({
      success: true,
      battleId,
      problem: {
        id: problemForBattle.id,
        title: problemForBattle.title,
        difficulty: problemForBattle.difficulty,
        description: problemForBattle.description,
        examples: problemForBattle.examples,
        starterCode: problemForBattle.starterCode,
      },
      opponent: {
        uid: opponentId,
        username: opponentData.username || 'Player',
        rating: opponentData.rating || 800,
      },
    });
  } catch (err: any) {
    if (err instanceof TransactionAbortError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[Battle Create] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
