import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limitCount = 20;

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('communityPosts').orderBy('createdAt', 'desc');

    if (type) {
      query = query.where('type', '==', type);
    }
    if (tag) {
      query = query.where('tags', 'array-contains', tag);
    }

    const offset = (page - 1) * limitCount;
    const snap = await query.limit(limitCount).offset(offset).get();
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ posts, page, hasMore: posts.length === limitCount });
  } catch (err: any) {
    console.error('[Community Posts GET] Error:', err);
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
    const { type, title, content, code, codeLanguage, tags } = body;

    if (!type || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields: type, title, content' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const userSnap = await db.collection('users').doc(uid).get();
    const userData = userSnap.data();

    const ref = await db.collection('communityPosts').add({
      userId: uid,
      username: userData?.username || 'Anonymous',
      photoURL: userData?.photoURL || '',
      type,
      title,
      content,
      code: code || null,
      codeLanguage: codeLanguage || null,
      tags: tags || [],
      likes: 0,
      comments: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[Community Posts POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
