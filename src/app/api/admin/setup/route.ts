import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';

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

    const db = getAdminFirestore();
    await db.collection('users').doc(uid).set(
      {
        role: 'super_admin',
        isAdmin: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return NextResponse.json({ success: true, uid, role: 'super_admin' });
  } catch (err: any) {
    console.error('[Admin Setup] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
