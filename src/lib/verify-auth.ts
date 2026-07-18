import { getAdminAuth, getAdminFirestore, initializeAdmin } from '@/firebase/admin';

export async function verifyAuth(request: Request): Promise<{ uid: string; email: string } | Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!initializeAdmin()) {
    return Response.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }

  const idToken = authHeader.slice(7);
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(uid).get();
    if (userSnap.exists) {
      const userData = userSnap.data()!;
      if (userData.banned === true) {
        return Response.json({ error: 'Account banned' }, { status: 403 });
      }
    }

    return { uid, email: decoded.email || '' };
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }
}
