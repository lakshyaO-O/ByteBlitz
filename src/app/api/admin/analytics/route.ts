import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { AdminRole } from '@/types/admin';
import { hasPermission } from '@/types/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

async function verifyAndGetRole(request: NextRequest): Promise<{ uid: string; role: AdminRole; email: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse;
  }
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(decodedToken.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 }) as NextResponse;
    }
    const userData = userSnap.data()!;
    const role: AdminRole = userData.role || (userData.isAdmin ? 'admin' : 'user');
    return { uid: decodedToken.uid, role, email: userData.email || '' };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 }) as NextResponse;
  }
}

function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAndGetRole(request);
    if (isErrorResponse(auth)) return auth;

    const rateCheck = checkRateLimit(auth.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    if (!hasPermission(auth.role, 'analytics.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminFirestore();
    const now = Date.now();

    // ── Date ranges ──
    const oneDayAgo = new Date(now - 86400000);
    const sevenDaysAgo = new Date(now - 7 * 86400000);
    const thirtyDaysAgo = new Date(now - 30 * 86400000);
    const dayStrings: string[] = [];
    for (let i = 29; i >= 0; i--) {
      dayStrings.push(new Date(now - i * 86400000).toISOString().slice(0, 10));
    }

    // ── Users (active + growth) ──
    const [allUsersSnap, dauSnap, wauSnap, mauSnap, newTodaySnap, newWeekSnap, newMonthSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('users').where('lastActive', '>=', oneDayAgo).get(),
      db.collection('users').where('lastActive', '>=', sevenDaysAgo).get(),
      db.collection('users').where('lastActive', '>=', thirtyDaysAgo).get(),
      db.collection('users').where('createdAt', '>=', oneDayAgo).get(),
      db.collection('users').where('createdAt', '>=', sevenDaysAgo).get(),
      db.collection('users').where('createdAt', '>=', thirtyDaysAgo).get(),
    ]);

    const totalUsers = allUsersSnap.size;
    const dau = dauSnap.size;
    const wau = wauSnap.size;
    const mau = mauSnap.size;

    // Signups per day (last 30 days)
    const signupsByDay: Record<string, number> = {};
    dayStrings.forEach(d => { signupsByDay[d] = 0; });
    allUsersSnap.docs.forEach(doc => {
      const data = doc.data();
      const created = data.createdAt?.toDate?.()?.toISOString()?.slice(0, 10);
      if (created && signupsByDay[created] !== undefined) {
        signupsByDay[created]++;
      }
    });

    // Active per day (last 30 days) from lastActive
    const activeByDay: Record<string, number> = {};
    dayStrings.forEach(d => { activeByDay[d] = 0; });
    allUsersSnap.docs.forEach(doc => {
      const data = doc.data();
      const la = data.lastActive?.toDate?.()?.toISOString()?.slice(0, 10);
      if (la && activeByDay[la] !== undefined) {
        activeByDay[la]++;
      }
    });

    // ── Retention (users created 7 days ago, were they active in last 7 days?) ──
    const eightDaysAgo = new Date(now - 8 * 86400000);
    const cohortSnap = await db.collection('users')
      .where('createdAt', '>=', eightDaysAgo)
      .where('createdAt', '<', new Date(now - 7 * 86400000))
      .get();

    const cohortTotal = cohortSnap.size;
    const cohortRetained = cohortSnap.docs.filter(d => {
      const la = d.data().lastActive?.toDate?.() || new Date(0);
      return la >= sevenDaysAgo;
    }).length;
    const day7Retention = cohortTotal > 0 ? Math.round((cohortRetained / cohortTotal) * 100) : 0;

    // 30-day retention
    const thirtyOneDaysAgo = new Date(now - 31 * 86400000);
    const cohort30Snap = await db.collection('users')
      .where('createdAt', '>=', thirtyOneDaysAgo)
      .where('createdAt', '<', new Date(now - 30 * 86400000))
      .get();
    const cohort30Total = cohort30Snap.size;
    const cohort30Retained = cohort30Snap.docs.filter(d => {
      const la = d.data().lastActive?.toDate?.() || new Date(0);
      return la >= thirtyDaysAgo;
    }).length;
    const day30Retention = cohort30Total > 0 ? Math.round((cohort30Retained / cohort30Total) * 100) : 0;

    // ── Submissions & Problems ──
    const subSnap = await db.collectionGroup('submissions')
      .orderBy('submittedAt', 'desc')
      .limit(500)
      .get();

    const submissions = subSnap.docs.map(d => {
      const data = d.data();
      return {
        problemId: data.problemId || '',
        problemTitle: data.problemTitle || data.problemId || '',
        language: data.language || 'unknown',
        verdict: data.verdict || 'Pending',
        executionTimeMs: data.executionTimeMs ?? 0,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || '',
      };
    });

    const totalSubmissions = submissions.length;
    const acceptedSubs = submissions.filter(s => s.verdict === 'Accepted');
    const totalAccepted = acceptedSubs.length;
    const acceptanceRate = totalSubmissions > 0 ? Math.round((totalAccepted / totalSubmissions) * 100) : 0;

    // Per-problem stats
    const problemMap: Record<string, { title: string; solved: number; total: number }> = {};
    submissions.forEach(s => {
      if (!problemMap[s.problemId]) {
        problemMap[s.problemId] = { title: s.problemTitle, solved: 0, total: 0 };
      }
      problemMap[s.problemId].total++;
      if (s.verdict === 'Accepted') problemMap[s.problemId].solved++;
    });

    const problemStats = Object.entries(problemMap)
      .map(([problemId, stats]) => ({
        problemId,
        title: stats.title,
        solved: stats.solved,
        total: stats.total,
        acceptanceRate: stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0,
      }))
      .filter(p => p.total > 0);

    const mostSolved = [...problemStats].sort((a, b) => b.solved - a.solved).slice(0, 10);
    const mostFailed = [...problemStats]
      .sort((a, b) => (b.total - b.solved) - (a.total - a.solved))
      .slice(0, 10);

    // Daily submissions (last 30 days)
    const dailySubs: Record<string, { count: number; accepted: number }> = {};
    dayStrings.forEach(d => { dailySubs[d] = { count: 0, accepted: 0 }; });
    submissions.forEach(s => {
      const day = s.submittedAt.slice(0, 10);
      if (dailySubs[day]) {
        dailySubs[day].count++;
        if (s.verdict === 'Accepted') dailySubs[day].accepted++;
      }
    });

    // ── Languages ──
    const langMap: Record<string, { count: number; accepted: number }> = {};
    submissions.forEach(s => {
      const lang = s.language || 'unknown';
      if (!langMap[lang]) langMap[lang] = { count: 0, accepted: 0 };
      langMap[lang].count++;
      if (s.verdict === 'Accepted') langMap[lang].accepted++;
    });
    const languages = Object.entries(langMap)
      .map(([language, stats]) => ({ language, ...stats }))
      .sort((a, b) => b.count - a.count);

    // ── AI Usage ──
    let mentorCalls = 0, reviewCalls = 0, debugCalls = 0, interviewerCalls = 0, roadmapCalls = 0, resumeCalls = 0;
    let usersWithAi = 0;
    allUsersSnap.docs.forEach(d => {
      const ai = d.data().aiUsage;
      if (ai) {
        usersWithAi++;
        mentorCalls += ai.mentor?.total || 0;
        reviewCalls += ai.codeReview?.total || 0;
        debugCalls += ai.debugger?.total || 0;
        interviewerCalls += ai.interviewer?.total || 0;
        roadmapCalls += ai.roadmap?.total || 0;
        resumeCalls += ai.resumeReview?.total || 0;
      }
    });
    const totalAiCalls = mentorCalls + reviewCalls + debugCalls + interviewerCalls + roadmapCalls + resumeCalls;

    // ── Community ──
    const [postsSnap, threadsSnap, commentsSnap] = await Promise.all([
      db.collection('communityPosts').get(),
      db.collection('forumThreads').get(),
      db.collectionGroup('comments').limit(1000).get(),
    ]);

    const totalPosts = postsSnap.size;
    const totalThreads = threadsSnap.size;
    const totalComments = commentsSnap.size;

    // Daily posts
    const dailyPosts: Record<string, number> = {};
    dayStrings.forEach(d => { dailyPosts[d] = 0; });
    postsSnap.docs.forEach(d => {
      const data = d.data();
      const day = data.createdAt?.toDate?.()?.toISOString()?.slice(0, 10);
      if (day && dailyPosts[day] !== undefined) dailyPosts[day]++;
    });

    // ── Reports ──
    const [reportsSnap, pendingReportsSnap] = await Promise.all([
      db.collection('reports').get(),
      db.collection('reports').where('status', '==', 'pending').get(),
    ]);

    const totalReports = reportsSnap.size;
    const pendingReports = pendingReportsSnap.size;

    const dailyReports: Record<string, number> = {};
    dayStrings.forEach(d => { dailyReports[d] = 0; });
    reportsSnap.docs.forEach(d => {
      const data = d.data();
      const day = data.createdAt?.toDate?.()?.toISOString()?.slice(0, 10);
      if (day && dailyReports[day] !== undefined) dailyReports[day]++;
    });

    // ── Traffic (active hours proxy from user lastActive) ──
    const activeByHour: Record<number, number> = {};
    for (let h = 0; h < 24; h++) activeByHour[h] = 0;
    allUsersSnap.docs.forEach(d => {
      const la = d.data().lastActive?.toDate?.();
      if (la && la >= oneDayAgo) {
        const hour = la.getHours();
        activeByHour[hour] = (activeByHour[hour] || 0) + 1;
      }
    });

    return NextResponse.json({
      activeUsers: {
        daily: dau,
        weekly: wau,
        monthly: mau,
        dailySeries: dayStrings.map(d => ({ date: d, count: activeByDay[d] || 0 })),
      },
      growth: {
        newUsersToday: newTodaySnap.size,
        newUsersThisWeek: newWeekSnap.size,
        newUsersThisMonth: newMonthSnap.size,
        totalUsers,
        signupsSeries: dayStrings.map(d => ({ date: d, count: signupsByDay[d] || 0 })),
      },
      retention: {
        day7: day7Retention,
        day30: day30Retention,
        cohortSize: cohortTotal,
        cohortRetained,
        cohort30Size: cohort30Total,
        cohort30Retained,
      },
      problems: {
        totalSubmissions,
        totalAccepted,
        acceptanceRate,
        mostSolved,
        mostFailed,
        dailySubmissions: dayStrings.map(d => ({
          date: d,
          count: dailySubs[d]?.count || 0,
          accepted: dailySubs[d]?.accepted || 0,
        })),
      },
      languages,
      aiUsage: {
        totalCalls: totalAiCalls,
        mentor: mentorCalls,
        codeReview: reviewCalls,
        debugger: debugCalls,
        interviewer: interviewerCalls,
        roadmap: roadmapCalls,
        resumeReview: resumeCalls,
        usersWithAi,
      },
      community: {
        totalPosts,
        totalThreads,
        totalComments,
        dailySeries: dayStrings.map(d => ({ date: d, count: dailyPosts[d] || 0 })),
      },
      traffic: {
        activeByHour: Object.entries(activeByHour).map(([hour, count]) => ({ hour: parseInt(hour), count })),
        dailyActiveSeries: dayStrings.map(d => ({ date: d, count: activeByDay[d] || 0 })),
      },
      reports: {
        pending: pendingReports,
        total: totalReports,
        dailySeries: dayStrings.map(d => ({ date: d, count: dailyReports[d] || 0 })),
      },
    });
  } catch (err: any) {
    console.error('[Admin Analytics] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
