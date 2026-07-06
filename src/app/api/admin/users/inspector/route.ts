import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { AdminRole } from '@/types/admin';
import { hasPermission } from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

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
    const actorSnap = await db.collection('users').doc(decodedToken.uid).get();
    if (!actorSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const actorData = actorSnap.data()!;
    const actorRole: AdminRole = actorData.role || (actorData.isAdmin ? 'admin' : 'user');
    const rateCheck = checkRateLimit(decodedToken.uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    if (!hasPermission(actorRole, 'users.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400 });
    }

    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data()!;

    // Fetch subcollection data in parallel
    const [
      subsSnap,
      friendsSnap,
      aiUsageSnap,
      communityPostsSnap,
      forumThreadsSnap,
      progressSnap,
      auditLogsSnap,
    ] = await Promise.all([
      db.collection('users').doc(uid).collection('submissions')
        .orderBy('submittedAt', 'desc').limit(20).get(),
      db.collection('users').doc(uid).collection('friends').get(),
      db.collection('users').doc(uid).collection('aiUsage').get(),
      db.collection('communityPosts').where('userId', '==', uid)
        .orderBy('createdAt', 'desc').limit(10).get(),
      db.collection('forumThreads').where('userId', '==', uid)
        .orderBy('createdAt', 'desc').limit(10).get(),
      db.collection('users').doc(uid).collection('progress').get(),
      db.collection('auditLogs').where('targetId', '==', uid)
        .orderBy('timestamp', 'desc').limit(10).get(),
    ]);

    const submissions = subsSnap.docs.map(d => {
      const s = d.data();
      return {
        id: d.id,
        problemId: s.problemId || '',
        language: s.language || '',
        verdict: s.verdict || '',
        passedTestCases: s.passedTestCases || 0,
        totalTestCases: s.totalTestCases || 0,
        executionTimeMs: s.executionTimeMs || 0,
        memoryUsedKb: s.memoryUsedKb || 0,
        submittedAt: s.submittedAt?.toDate?.()?.toISOString() || s.submittedAt || '',
      };
    });

    const friendsCount = friendsSnap.size;

    const aiUsage: Record<string, { daily: number; total: number }> = {};
    aiUsageSnap.docs.forEach(d => {
      const data = d.data();
      aiUsage[d.id] = { daily: data.daily || data.count || 0, total: data.total || 0 };
    });

    const communityPosts = communityPostsSnap.docs.map(d => ({
      id: d.id,
      title: d.data().title || '',
      type: d.data().type || '',
      likes: d.data().likes || 0,
      comments: d.data().comments || 0,
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || '',
    }));

    const forumThreads = forumThreadsSnap.docs.map(d => ({
      id: d.id,
      title: d.data().title || '',
      replies: d.data().replies || 0,
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || '',
    }));

    const progress = progressSnap.docs.map(d => ({
      problemId: d.id,
      solved: d.data().solved || false,
      attempted: d.data().attempted || false,
    }));
    const problemsSolved = progress.filter(p => p.solved).length;
    const problemsAttempted = progress.filter(p => p.attempted).length;

    const auditLogEntries = auditLogsSnap.docs.map(d => {
      const a = d.data();
      return {
        id: d.id,
        action: a.action || '',
        performedBy: a.performedBy || '',
        performedByEmail: a.performedByEmail || '',
        severity: a.severity || 'info',
        timestamp: a.timestamp?.toDate?.()?.toISOString() || a.timestamp || '',
      };
    });

    // Languages used
    const languages = new Set(submissions.map(s => s.language).filter(Boolean));
    const languagesUsed = Array.from(languages);

    // Calculate accepted rate
    const totalSubs = submissions.length;
    const acceptedSubs = submissions.filter(s => s.verdict === 'Accepted').length;
    const acceptedRate = totalSubs > 0 ? Math.round((acceptedSubs / totalSubs) * 100) : 0;

    // Session / device info
    const sessionInfo = userData.activeRoomId ? { activeRoom: userData.activeRoomId } : null;

    return NextResponse.json({
      profile: {
        id: uid,
        uid: userData.uid || uid,
        publicId: userData.publicId || '',
        username: userData.username || '',
        email: userData.email || '',
        photoURL: userData.photoURL || '',
        bio: userData.bio || '',
        role: userData.role || (userData.isAdmin ? 'admin' : 'user'),
        isAdmin: userData.isAdmin || false,
        banned: userData.banned || false,
        muted: userData.muted || false,
        subscriptionTier: userData.subscriptionTier || 'free',
        emailVerified: userData.emailVerified || false,
        createdAt: userData.createdAt?.toDate?.()?.toISOString() || userData.createdAt || '',
        lastActive: userData.lastActive?.toDate?.()?.toISOString() || userData.lastActive || '',
        lastLoginDate: userData.lastLoginDate || '',
        xp: userData.xp || 0,
        level: userData.level || 0,
        rank: userData.rank || 0,
        rating: userData.rating || 0,
        highestRating: userData.highestRating || 0,
        tier: userData.tier || 'Beginner',
        streak: userData.streak || 0,
        dailyLoginStreak: userData.dailyLoginStreak || 0,
        longestStreak: userData.longestStreak || 0,
        coins: userData.coins || 0,
        devcoins: userData.devcoins || 0,
        wins: userData.wins || 0,
        losses: userData.losses || 0,
        draws: userData.draws || 0,
        problemsSolved: userData.problemsSolved || 0,
        problemsAttempted: problemsAttempted,
        accuracy: userData.accuracy || 0,
        preferredLanguage: userData.preferredLanguage || '',
        onlineStatus: userData.onlineStatus || 'offline',
        badge: userData.badge || '',
        title: userData.title || '',
        learningGoals: userData.learningGoals || [],
        badges: userData.badges || [],
        achievements: userData.achievements || [],
        contestHistory: userData.contestHistory || [],
        totalCodingTime: userData.totalCodingTime || 0,
        onboardingCompleted: userData.onboardingCompleted || false,
        referralCode: userData.referralCode || '',
        referredBy: userData.referredBy || '',
        githubUrl: userData.githubUrl || '',
        linkedinUrl: userData.linkedinUrl || '',
        twitterUrl: userData.twitterUrl || '',
        websiteUrl: userData.websiteUrl || '',
        editorTheme: userData.editorTheme || '',
        editorFontSize: userData.editorFontSize || 14,
        activeRoomId: userData.activeRoomId || null,
        userAgent: userData.userAgent || null,
      },
      stats: {
        submissions: totalSubs,
        acceptedSubs,
        acceptedRate,
        friendsCount,
        problemsSolved: progress.filter(p => p.solved).length,
        problemsAttempted: progress.filter(p => p.attempted).length,
        totalCodingTime: userData.totalCodingTime || 0,
      },
      submissions,
      languagesUsed,
      aiUsage,
      communityPosts,
      forumThreads,
      progress,
      auditLogs: auditLogEntries,
      session: sessionInfo,
    });
  } catch (err: any) {
    console.error('[User Inspector] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
