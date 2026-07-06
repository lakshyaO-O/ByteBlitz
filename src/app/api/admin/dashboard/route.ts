import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { AdminRole } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

function isAdminRole(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin';
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

    const userData = userSnap.data()!;
    const role: AdminRole = userData.role || (userData.isAdmin ? 'admin' : 'user');
    if (!isAdminRole(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rateCheck = checkRateLimit(decodedToken.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    const now = Date.now();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [
      usersCountSnap,
      problemsCountSnap,
      postsCountSnap,
      subsTodaySnap,
      reportsSnap,
      newestUsersSnap,
      newestProblemsSnap,
      newestPostsSnap,
      newestReportsSnap,
    ] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('problems').count().get(),
      db.collection('communityPosts').count().get(),
      db.collection('submissions')
        .where('submittedAt', '>=', todayStart)
        .count()
        .get(),
      db.collection('reports').where('resolved', '==', false).count().get(),
      db.collection('users').orderBy('createdAt', 'desc').limit(5).get(),
      db.collection('problems').orderBy('createdAt', 'desc').limit(5).get(),
      db.collection('communityPosts').orderBy('createdAt', 'desc').limit(5).get(),
      db.collection('reports').orderBy('createdAt', 'desc').limit(5).get(),
    ]);

    const newestUsers = newestUsersSnap.docs.map(d => ({
      id: d.id,
      username: d.data().username || '',
      email: d.data().email || '',
      photoURL: d.data().photoURL || '',
      xp: d.data().xp || 0,
      tier: d.data().tier || 'Beginner',
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || '',
    }));

    const newestProblems = newestProblemsSnap.docs.map(d => ({
      id: d.id,
      title: d.data().title || '',
      difficulty: d.data().difficulty || 'Easy',
      category: d.data().category || '',
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || '',
    }));

    const newestPosts = newestPostsSnap.docs.map(d => ({
      id: d.id,
      title: d.data().title || '',
      username: d.data().username || '',
      type: d.data().type || '',
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || '',
    }));

    const newestReports = newestReportsSnap.docs.map(d => ({
      id: d.id,
      reason: d.data().reason || '',
      reportedBy: d.data().reportedBy || '',
      targetType: d.data().targetType || '',
      resolved: d.data().resolved || false,
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || '',
    }));

    const twentyFourHoursAgo = new Date(now - 86400000);
    const activeUsersSnap = await db.collection('users')
      .where('lastActive', '>=', twentyFourHoursAgo)
      .count()
      .get();

    return NextResponse.json({
      totalUsers: usersCountSnap.data().count,
      activeUsers24h: activeUsersSnap.data().count,
      totalProblems: problemsCountSnap.data().count,
      submissionsToday: subsTodaySnap.data().count,
      communityPosts: postsCountSnap.data().count,
      reportsPending: reportsSnap.data().count,
      judgeStatus: 'operational',
      serverHealth: 'healthy',
      newestUsers,
      newestProblems,
      newestPosts,
      newestReports,
    });
  } catch (err: any) {
    console.error('[Admin Dashboard] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
