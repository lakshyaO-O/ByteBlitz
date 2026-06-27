import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db: any = null;
try {
  try {
    getApp();
    db = getFirestore();
  } catch {
    const adminSdk = process.env.FIREBASE_ADMIN_SDK;
    if (adminSdk && adminSdk.includes('project_id')) {
      const serviceAccount = JSON.parse(adminSdk);
      initializeApp({
        credential: cert(serviceAccount),
      });
      db = getFirestore();
    }
  }
} catch (e) {
  console.error("Firebase admin init failed, running in mock mode:", e);
}

export async function POST(req: NextRequest) {
  try {
    const {
      battleId,
      userId1,
      userId2,
      code1,
      code2,
      score1,
      score2,
      timeUsed1,
      timeUsed2,
      problemId,
      problemTitle,
    } = await req.json();

    // Determine winner
    let result1, result2;
    if (score1 > score2) {
      result1 = 'WIN';
      result2 = 'LOSS';
    } else if (score2 > score1) {
      result1 = 'LOSS';
      result2 = 'WIN';
    } else {
      result1 = 'DRAW';
      result2 = 'DRAW';
    }

    if (!db) {
      return NextResponse.json({
        success: true,
        battleId,
        player1Result: result1,
        player2Result: result2,
      });
    }

    // Get player 2 info for player 1's record
    const user2Data = (await db.collection('users').doc(userId2).get()).data();
    const user1Data = (await db.collection('users').doc(userId1).get()).data();

    const battleData = {
      battleId,
      opponentId: userId2,
      opponentName: user2Data?.username || 'Opponent',
      result: result1,
      yourScore: score1,
      opponentScore: score2,
      timeUsed: timeUsed1,
      opponentTimeUsed: timeUsed2,
      problem: {
        id: problemId,
        title: problemTitle,
      },
      timestamp: new Date(),
    };

    // Save to both players' combat logs
    await Promise.all([
      db
        .collection('users')
        .doc(userId1)
        .collection('combatLogs')
        .add(battleData),
      db
        .collection('users')
        .doc(userId2)
        .collection('combatLogs')
        .add({
          ...battleData,
          opponentId: userId1,
          opponentName: user1Data?.username || 'Opponent',
          result: result2,
          yourScore: score2,
          opponentScore: score1,
          timeUsed: timeUsed2,
          opponentTimeUsed: timeUsed1,
        }),
    ]);

    // Create global battle record
    await db.collection('battles').add({
      battleId,
      player1Id: userId1,
      player1Name: user1Data?.username,
      player2Id: userId2,
      player2Name: user2Data?.username,
      score1,
      score2,
      result1,
      result2,
      timeUsed1,
      timeUsed2,
      problem: {
        id: problemId,
        title: problemTitle,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      battleId,
      player1Result: result1,
      player2Result: result2,
    });
  } catch (error) {
    console.error('Battle submission error:', error);
    return NextResponse.json(
      { error: 'Failed to save battle' },
      { status: 500 }
    );
  }
}
