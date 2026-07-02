'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, serverTimestamp, increment, arrayUnion,
} from 'firebase/firestore';
import type { ShopItem, UserInventory } from '@/types';

export async function getShopItems(category?: string): Promise<ShopItem[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const constraints: any[] = [where('available', '==', true), orderBy('price', 'asc')];
  if (category) constraints.unshift(where('type', '==', category));

  const q = query(collection(db, 'shopItems'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShopItem));
}

export async function purchaseItem(userId: string, itemId: string): Promise<boolean> {
  const { firestore: db } = initializeFirebase();
  if (!db) return false;

  const itemRef = doc(db, 'shopItems', itemId);
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists()) return false;

  const item = itemSnap.data() as ShopItem;
  if (!item.available) return false;

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return false;

  const userData = userSnap.data();
  const balance = item.currency === 'coins' ? (userData.coins || 0) : item.currency === 'xp' ? (userData.xp || 0) : (userData.gems || 0);

  if (balance < item.price) return false;

  const inventoryRef = doc(db, 'users', userId, 'inventory', 'default');
  const inventorySnap = await getDoc(inventoryRef);

  const updateFields: Record<string, any> = {};
  if (item.currency === 'coins') updateFields.coins = increment(-item.price);
  else if (item.currency === 'xp') updateFields.xp = increment(-item.price);
  else updateFields.gems = increment(-item.price);

  await updateDoc(userRef, updateFields);

  if (inventorySnap.exists()) {
    await updateDoc(inventoryRef, {
      items: arrayUnion(itemId),
    });
  } else {
    await setDoc(inventoryRef, {
      userId,
      items: [itemId],
      equipped: {},
    });
  }

  return true;
}

export async function getInventory(userId: string): Promise<UserInventory | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const snap = await getDoc(doc(db, 'users', userId, 'inventory', 'default'));
  return snap.exists() ? ({ userId, ...snap.data() } as UserInventory) : null;
}

export async function equipItem(userId: string, itemId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const inventoryRef = doc(db, 'users', userId, 'inventory', 'default');
  const itemSnap = await getDoc(doc(db, 'shopItems', itemId));
  if (!itemSnap.exists()) return;

  const item = itemSnap.data() as ShopItem;
  await updateDoc(inventoryRef, {
    [`equipped.${item.type}`]: itemId,
  });
}
