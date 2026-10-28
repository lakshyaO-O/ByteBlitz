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

    if (!opponentId || typeof opponentId !== 'string') {
      return NextResponse.json({ error: 'Missing opponentId' }, { status: 400 });
    }
    if (opponentId === uid) {
      return NextResponse.json({ error: 'You cannot battle yourself' }, { status: 400 });
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
      const minutes = Math.min(parseInt(match[1], 10) || 5, 60);
      return Math.max(minutes, 1) * 60 * 1000;
    })();

    const starter = problemContent.starterCode || {};
    const fallbackLanguage = Object.keys(starter)[0] || 'python';
    const resolveLanguage = (raw: any): string => {
      const lang = typeof raw === 'string' ? raw : '';
      return starter?.[lang] ? lang : fallbackLanguage;
    };
    const p1Lang = resolveLanguage(language);
    const p2Lang = resolveLanguage(opponentData.preferredLanguage);

    const allTestCases: Array<{ input: string; expected: string; isHidden?: boolean }> =
      problemContent.testCases || [];
    const visibleTests = allTestCases
      .filter((tc) => !tc.isHidden)
      .map((tc) => ({ input: String(tc.input ?? ''), expected: String(tc.expected ?? '') }));
    if (visibleTests.length === 0 && allTestCases.length > 0) {
      visibleTests.push({
        input: String(allTestCases[0].input ?? ''),
        expected: String(allTestCases[0].expected ?? ''),
      });
    }

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
      tags: problemMeta.tags || [],
      starterCode: problemContent.starterCode || {},
      visibleTests,
      functionStyle: !!problemContent.functionStyle,
    };

    const toProgress = (u: any, lang: string) => ({
      userId: u.uid,
      username: u.username || 'Player',
      rating: u.rating || 800,
      tier: u.tier || 'Beginner',
      score: 0,
      submitted: false,
      code: '',
      language: lang,
      passedTestCases: 0,
      totalTestCases: 0,
      submissionCount: 0,
      result: 'pending',
      eloChange: 0,
    });

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
        player1: toProgress(userData, p1Lang),
        player2: toProgress(opponentData, p2Lang),
        participants: [uid, opponentId],
        problem: {
          id: problemForBattle.id,
          title: problemForBattle.title,
          difficulty: problemForBattle.difficulty,
          category: problemForBattle.category,
          points: problemForBattle.points,
          description: problemForBattle.description,
          constraints: problemForBattle.constraints,
          inputFormat: problemForBattle.inputFormat,
          outputFormat: problemForBattle.outputFormat,
          examples: problemForBattle.examples,
          tags: problemForBattle.tags,
          starterCode: problemForBattle.starterCode,
          visibleTests: problemForBattle.visibleTests,
          functionStyle: problemForBattle.functionStyle,
        },
        status: 'countdown',
        phase: 'countdown',
        matchType: rated ? 'ranked' : 'quick',
        timeControl: timeControl || '5+0',
        totalTimeMs,
        rated: !!rated,
        countdownStartedAt: FieldValue.serverTimestamp(),
        codingStartedAt: '',
        roomCode: Array.from({ length: 6 }, () =>
          'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 30)]
        ).join(''),
        winnerIds: [],
        finished: false,
        durationSec: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const nowIso = new Date().toISOString();
      transaction.update(player1Ref, {
        status: 'matched',
        battleId: ref.id,
        matchedAt: nowIso,
        opponent: {
          uid: opponentId,
          username: opponentData.username || 'Player',
          rating: opponentData.rating || 800,
          tier: opponentData.tier || 'Beginner',
        },
      });
      transaction.update(player2Ref, {
        status: 'matched',
        battleId: ref.id,
        matchedAt: nowIso,
        opponent: {
          uid,
          username: userData.username || 'Player',
          rating: userData.rating || 800,
          tier: userData.tier || 'Beginner',
        },
      });

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
