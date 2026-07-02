import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('shopItems')
      .where('available', '==', true)
      .orderBy('price', 'asc');

    if (category) {
      query = query.where('type', '==', category);
    }

    const snap = await query.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('[Shop Items GET] Error:', err);
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
    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const itemRef = db.collection('shopItems').doc(itemId);
    const itemSnap = await itemRef.get();

    if (!itemSnap.exists) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const item = itemSnap.data()!;
    if (!item.available) {
      return NextResponse.json({ error: 'Item not available' }, { status: 400 });
    }

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data()!;
    const balance = item.currency === 'coins' ? (userData.coins || 0) : item.currency === 'xp' ? (userData.xp || 0) : (userData.gems || 0);

    if (balance < item.price) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const updateFields: Record<string, any> = {};
    if (item.currency === 'coins') updateFields.coins = FieldValue.increment(-item.price);
    else if (item.currency === 'xp') updateFields.xp = FieldValue.increment(-item.price);
    else updateFields.gems = FieldValue.increment(-item.price);

    await userRef.update(updateFields);

    const inventoryRef = db.collection('users').doc(uid).collection('inventory').doc('default');
    const inventorySnap = await inventoryRef.get();

    if (inventorySnap.exists) {
      await inventoryRef.update({ items: FieldValue.arrayUnion(itemId) });
    } else {
      await inventoryRef.set({ userId: uid, items: [itemId], equipped: {} });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Shop Purchase] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
