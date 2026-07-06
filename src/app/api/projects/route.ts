import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const technologies = searchParams.get('technologies')?.split(',').filter(Boolean);
    const userId = searchParams.get('userId');

    const db = getAdminFirestore();

    if (userId) {
      const q = db.collection('projects')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');
      const snap = await q.get();
      const projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ projects });
    }

    let query: FirebaseFirestore.Query = db.collection('projects').orderBy('likes', 'desc').limit(20);

    if (tags && tags.length > 0) {
      query = query.where('tags', 'array-contains-any', tags);
    }
    if (technologies && technologies.length > 0) {
      query = query.where('technologies', 'array-contains-any', technologies);
    }

    const snap = await query.get();
    const projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ projects });
  } catch (err: any) {
    console.error('[Projects GET] Error:', err);
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
    const rateCheck = checkRateLimit(uid, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    const body = await request.json();
    const { title, description, technologies, screenshots, liveUrl, githubUrl, tags } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Missing required fields: title, description' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(uid).get();
    const userData = userSnap.data();

    const ref = await db.collection('projects').add({
      userId: uid,
      username: userData?.username || 'Anonymous',
      photoURL: userData?.photoURL || '',
      title,
      description,
      technologies: technologies || [],
      screenshots: screenshots || [],
      liveUrl: liveUrl || null,
      githubUrl: githubUrl || null,
      featured: false,
      likes: 0,
      views: 0,
      tags: tags || [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[Projects POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
