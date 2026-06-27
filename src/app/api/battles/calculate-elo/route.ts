import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let db;
try {
  getApp();
  db = getFirestore();
} catch {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK || '{}');
  initializeApp({
    credential: cert(serviceAccount),
  });
  db = getFirestore();
}

const ELO_K = 32; // K-factor for ELO calculation

export async function POST(req: NextRequest) {
  try {
    const { userId1, userId2, score1, score2 } = await req.json();

    // Get both players
    const user1Ref = db.collection('users').doc(userId1);
    const user2Ref = db.collection('users').doc(userId2);

    const [user1Doc, user2Doc] = await Promise.all([
      user1Ref.get(),
      user2Ref.get(),
    ]);

    const user1Data = user1Doc.data();
    const user2Data = user2Doc.data();

    if (!user1Data || !user2Data) {
      return NextResponse.json(
        { error: 'One or both users not found' },
        { status: 404 }
      );
    }

    const rating1 = user1Data.rating || 1200;
    const rating2 = user2Data.rating || 1200;

    // Calculate expected scores
    const expectedScore1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
    const expectedScore2 = 1 / (1 + Math.pow(10, (rating1 - rating2) / 400));

    // Determine actual scores (1 = win, 0.5 = draw, 0 = loss)
    let actualScore1, actualScore2;
    if (score1 > score2) {
      actualScore1 = 1;
      actualScore2 = 0;
    } else if (score2 > score1) {
      actualScore1 = 0;
      actualScore2 = 1;
    } else {
      actualScore1 = 0.5;
      actualScore2 = 0.5;
    }

    // Calculate new ratings
    const newRating1 = Math.round(rating1 + ELO_K * (actualScore1 - expectedScore1));
    const newRating2 = Math.round(rating2 + ELO_K * (actualScore2 - expectedScore2));

    const eloChange1 = newRating1 - rating1;
    const eloChange2 = newRating2 - rating2;

    // Update user ratings
    await Promise.all([
      user1Ref.update({
        rating: newRating1,
        highestRating: Math.max(user1Data.highestRating || 1200, newRating1),
        ...(actualScore1 === 1 && { wins: (user1Data.wins || 0) + 1 }),
        ...(actualScore1 === 0 && { losses: (user1Data.losses || 0) + 1 }),
        ...(actualScore1 === 0.5 && { draws: (user1Data.draws || 0) + 1 }),
        updatedAt: new Date(),
      }),
      user2Ref.update({
        rating: newRating2,
        highestRating: Math.max(user2Data.highestRating || 1200, newRating2),
        ...(actualScore2 === 1 && { wins: (user2Data.wins || 0) + 1 }),
        ...(actualScore2 === 0 && { losses: (user2Data.losses || 0) + 1 }),
        ...(actualScore2 === 0.5 && { draws: (user2Data.draws || 0) + 1 }),
        updatedAt: new Date(),
      }),
    ]);

    return NextResponse.json({
      player1: {
        newRating: newRating1,
        eloChange: eloChange1,
        result: actualScore1 === 1 ? 'WIN' : actualScore1 === 0.5 ? 'DRAW' : 'LOSS',
      },
      player2: {
        newRating: newRating2,
        eloChange: eloChange2,
        result: actualScore2 === 1 ? 'WIN' : actualScore2 === 0.5 ? 'DRAW' : 'LOSS',
      },
    });
  } catch (error) {
    console.error('ELO calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ELO' },
      { status: 500 }
    );
  }
}
