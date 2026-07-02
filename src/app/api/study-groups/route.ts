import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const isPublic = searchParams.get('isPublic');

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('studyGroups').orderBy('memberCount', 'desc').limit(20);

    if (topic) {
      query = query.where('topic', '==', topic);
    }
    if (isPublic !== null) {
      query = query.where('isPublic', '==', isPublic === 'true');
    }

    const snap = await query.get();
    const groups = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ groups });
  } catch (err: any) {
    console.error('[Study Groups GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const body = await request.json();
    const { name, description, topic, maxMembers, isPublic, tags, schedule, resources } = body;

    if (!name || !description || !topic) {
      return NextResponse.json({ error: 'Missing required fields: name, description, topic' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(uid).get();
    const userData = userSnap.data();

    const ref = await db.collection('studyGroups').add({
      name,
      description,
      topic,
      createdBy: uid,
      adminIds: [uid],
      memberIds: [uid],
      memberCount: 1,
      maxMembers: maxMembers || 20,
      isPublic: isPublic !== undefined ? isPublic : true,
      tags: tags || [],
      schedule: schedule || '',
      resources: resources || [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[Study Groups POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
