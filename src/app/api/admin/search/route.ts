import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { AdminRole } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

function isStaffRole(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'moderator' || role === 'support';
}

export async function GET(request: NextRequest) {
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

    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(decodedToken.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const role: AdminRole = userSnap.data()!.role || (userSnap.data()!.isAdmin ? 'admin' : 'user');
    const rateCheck = checkRateLimit(decodedToken.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    if (!isStaffRole(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim().toLowerCase() || '';
    const type = searchParams.get('type') || 'all';

    if (!q || q.length < 2) {
      return NextResponse.json({ results: { users: [], problems: [], posts: [] } });
    }

    const results: { users: any[]; problems: any[]; posts: any[] } = {
      users: [],
      problems: [],
      posts: [],
    };

    if (type === 'all' || type === 'users') {
      const usersSnap = await db.collection('users')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      results.users = usersSnap.docs
        .filter(d => {
          const data = d.data();
          return (
            data.username?.toLowerCase().includes(q) ||
            data.email?.toLowerCase().includes(q) ||
            d.id?.toLowerCase().includes(q)
          );
        })
        .slice(0, 5)
        .map(d => ({
          id: d.id,
          uid: d.data().uid || d.id,
          username: d.data().username || '',
          email: d.data().email || '',
          photoURL: d.data().photoURL || '',
          role: d.data().role || 'user',
          banned: d.data().banned || false,
        }));
    }

    if (type === 'all' || type === 'problems') {
      const problemsSnap = await db.collection('problems')
        .orderBy('title', 'asc')
        .limit(20)
        .get();

      results.problems = problemsSnap.docs
        .filter(d => {
          const data = d.data();
          return (
            data.title?.toLowerCase().includes(q) ||
            data.category?.toLowerCase().includes(q) ||
            (data.tags && data.tags.some((t: string) => t.toLowerCase().includes(q)))
          );
        })
        .slice(0, 5)
        .map(d => ({
          id: d.id,
          title: d.data().title || '',
          difficulty: d.data().difficulty || 'Easy',
          isPublished: d.data().isPublished !== false,
        }));
    }

    if (type === 'all' || type === 'posts') {
      const postsSnap = await db.collection('communityPosts')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      results.posts = postsSnap.docs
        .filter(d => {
          const data = d.data();
          return (
            data.title?.toLowerCase().includes(q) ||
            data.content?.toLowerCase().includes(q) ||
            data.username?.toLowerCase().includes(q)
          );
        })
        .slice(0, 5)
        .map(d => ({
          id: d.id,
          title: d.data().title || '',
          username: d.data().username || '',
          type: d.data().type || '',
          createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || '',
        }));
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('[Admin Search] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
