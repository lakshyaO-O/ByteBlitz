import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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
    const { username, email, photoURL } = await request.json();

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 });
    }

    if (username.trim().length > 20) {
      return NextResponse.json({ error: 'Username must be at most 20 characters' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(uid);
    const existingUser = await userRef.get();

    if (existingUser.exists) {
      return NextResponse.json({ error: 'User profile already exists' }, { status: 409 });
    }

    const usernameLower = username.trim().toLowerCase();
    const usernameRef = db.collection('usernames').doc(usernameLower);

    let publicId: string;
    try {
      publicId = await db.runTransaction(async (transaction) => {
        const usernameDoc = await transaction.get(usernameRef);
        if (usernameDoc.exists) {
          throw new Error('Username already taken');
        }

        const candidate = 'u_' + Array.from({ length: 12 }, () =>
          'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
        ).join('');

        transaction.set(userRef, {
          uid,
          publicId: candidate,
          username: username.trim(),
          email: email || decodedToken.email || '',
          photoURL: photoURL || '',
          coins: 0,
          xp: 0,
          level: 1,
          rating: 1200,
          highestRating: 1200,
          highestScore: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          totalGamesPlayed: 0,
          tier: 'Beginner',
          rank: 0,
          role: 'user',
          lastActive: FieldValue.serverTimestamp(),
          onlineStatus: 'online',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        transaction.set(usernameRef, {
          name: usernameLower,
          userId: uid,
          claimedAt: FieldValue.serverTimestamp(),
        });

        return candidate;
      });
    } catch {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    try {
      await db.collection('leaderboard').doc(uid).set({
        userId: uid,
        username: username.trim(),
        photoURL: photoURL || '',
        rating: 1200,
        wins: 0,
        tier: 'Beginner',
        period: 'all-time',
        periodStart: FieldValue.serverTimestamp(),
        periodEnd: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch {
      // non-critical
    }

    return NextResponse.json({ success: true, uid, publicId });
  } catch (err: any) {
    console.error('[Auth Create Profile] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
