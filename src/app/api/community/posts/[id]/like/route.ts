import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    const postRef = db.collection('communityPosts').doc(id);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = postSnap.data()!;
    const likedBy = postData.likedBy || [];

    if (likedBy.includes(uid)) {
      await postRef.update({
        likes: FieldValue.increment(-1),
        likedBy: FieldValue.arrayRemove(uid),
      });
      return NextResponse.json({ liked: false });
    } else {
      await postRef.update({
        likes: FieldValue.increment(1),
        likedBy: FieldValue.arrayUnion(uid),
      });
      return NextResponse.json({ liked: true });
    }
  } catch (err: any) {
    console.error('[Community Post Like] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
