import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { authenticateRequest, isResponse } from '@/lib/hub-utils';
import { hasPermission } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, true, 'analytics.read');
    if (isResponse(auth)) return auth;

    const db = getAdminFirestore();

    const [bugReports, features, contactMessages, events, challenges, careers, applications, roadmapItems] =
      await Promise.all([
        db.collection('bugReports').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
        db.collection('featureRequests').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
        db.collection('contactMessages').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
        db.collection('hubEvents').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
        db.collection('hubChallenges').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
        db.collection('careerOpportunities').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
        db.collection('hostApplications').where('status', '==', 'pending').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
        db.collection('roadmapItems').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      ]);

    const recentReports = await db.collection('bugReports')
      .orderBy('createdAt', 'desc').limit(5).get().catch(() => ({ docs: [] }));
    const pendingApplications = await db.collection('hostApplications')
      .where('status', '==', 'pending').limit(5).get().catch(() => ({ docs: [] }));

    return NextResponse.json({
      counts: {
        bugReports: bugReports.data().count,
        features: features.data().count,
        contactMessages: contactMessages.data().count,
        events: events.data().count,
        challenges: challenges.data().count,
        careers: careers.data().count,
        pendingApplications: applications.data().count,
        roadmapItems: roadmapItems.data().count,
      },
      recentReports: recentReports.docs.map(d => ({ id: d.id, ...d.data() })),
      pendingApplications: pendingApplications.docs.map(d => ({ id: d.id, ...d.data() })),
    });
  } catch (err: any) {
    console.error('[Hub Admin GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
