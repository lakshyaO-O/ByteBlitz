import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';

export async function GET(request: NextRequest) {
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
    const db = getAdminFirestore();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const q = db.collection('users').doc(uid).collection('missions')
      .where('expiresAt', '>=', todayStr)
      .orderBy('expiresAt', 'asc');
    const snap = await q.get();

    if (snap.empty) {
      const missionTemplates = [
        { title: 'Code Warrior', description: 'Solve 3 practice problems', type: 'practice', requirement: 3, xpReward: 50, coinReward: 25, difficulty: 'easy' },
        { title: 'Arena Fighter', description: 'Complete 1 arena battle', type: 'arena', requirement: 1, xpReward: 75, coinReward: 30, difficulty: 'easy' },
        { title: 'Streak Keeper', description: 'Maintain your login streak', type: 'streak', requirement: 1, xpReward: 30, coinReward: 15, difficulty: 'easy' },
      ];

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const expiresAt = todayEnd.toISOString();
      const missions: any[] = [];

      for (const template of missionTemplates) {
        const ref = await db.collection('users').doc(uid).collection('missions').add({
          ...template,
          progress: 0,
          completed: false,
          claimed: false,
          expiresAt,
        });
        missions.push({ id: ref.id, ...template, progress: 0, completed: false, claimed: false, expiresAt });
      }

      return NextResponse.json({ missions });
    }

    const missions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ missions });
  } catch (err: any) {
    console.error('[Daily Missions GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
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
    const { missionId, progress } = await request.json();

    if (!missionId || progress === undefined) {
      return NextResponse.json({ error: 'Missing missionId or progress' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const ref = db.collection('users').doc(uid).collection('missions').doc(missionId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    const data = snap.data()!;
    const newProgress = Math.min(progress, data.requirement);
    const completed = newProgress >= data.requirement;

    await ref.update({ progress: newProgress, completed });

    return NextResponse.json({ progress: newProgress, completed });
  } catch (err: any) {
    console.error('[Daily Missions POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
