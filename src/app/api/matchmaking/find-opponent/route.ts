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
    const { userId, rating, tier } = await req.json();

    if (!db) {
      // Mock match found immediately!
      const mockOpponents = [
        { id: 'bot-1', username: 'AlgorithmBot', rating: 1250, tier: 'Intermediate' },
        { id: 'bot-2', username: 'ByteCoder', rating: 1180, tier: 'Beginner' },
        { id: 'bot-3', username: 'MatrixMaster', rating: 1350, tier: 'Expert' }
      ];
      const opponent = mockOpponents[Math.floor(Math.random() * mockOpponents.length)];
      return NextResponse.json({
        found: true,
        opponent,
        battleId: `mock_battle_${Date.now()}`
      });
    }

    // Add player to matchmaking queue
    const matchmakingRef = db.collection('matchmaking').doc(userId);
    await matchmakingRef.set({
      userId,
      username: (await db.collection('users').doc(userId).get()).data()?.username || 'Player',
      rating,
      tier,
      status: 'waiting',
      createdAt: new Date(),
    });

    // Look for an opponent within ELO range
    // Start with ±100, expand every 2 seconds
    const searchRanges = [100, 150, 200, 300, 500];

    for (const range of searchRanges) {
      const opponentsSnapshot = await db
        .collection('matchmaking')
        .where('rating', '>=', rating - range)
        .where('rating', '<=', rating + range)
        .where('status', '==', 'waiting')
        .limit(2)
        .get();

      if (opponentsSnapshot.size >= 2) {
        const docs = opponentsSnapshot.docs;
        const opponent = docs.find(doc => doc.id !== userId);

        if (opponent) {
          // Found a match!
          const opponentData = opponent.data();
          
          // Mark both as matched
          await Promise.all([
            matchmakingRef.update({ status: 'matched' }),
            opponent.ref.update({ status: 'matched' }),
          ]);

          return NextResponse.json({
            found: true,
            opponent: {
              id: opponent.id,
              username: opponentData.username,
              rating: opponentData.rating,
              tier: opponentData.tier,
            },
            battleId: `${userId}_${opponent.id}_${Date.now()}`,
          });
        }
      }
    }

    // No opponent found in any range
    return NextResponse.json({
      found: false,
      message: 'Waiting for opponent...',
      retryAfter: 2,
    });
  } catch (error) {
    console.error('Matchmaking error:', error);
    return NextResponse.json(
      { error: 'Matchmaking failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!db) {
      return NextResponse.json({ success: true });
    }

    // Remove player from matchmaking queue
    await db.collection('matchmaking').doc(userId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel matchmaking error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel matchmaking' },
      { status: 500 }
    );
  }
}
