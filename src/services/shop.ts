'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  query, where, orderBy, limit, serverTimestamp, increment, arrayUnion, arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import type {
  ShopItem, UserInventory, PurchaseRecord, DevCoinEarning, DevCoinSource, EarningLimit, ShopItemType,
} from '@/types';
import { EARNING_LIMITS } from '@/types';

const SHOP_COLLECTION = 'shopItems';
const INVENTORY_DOC = 'default';

function now(): string {
  return new Date().toISOString();
}

function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function weekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ---- Shop Items ----

export async function getShopItems(category?: ShopItemType): Promise<ShopItem[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const constraints: any[] = [where('available', '==', true), orderBy('sortOrder', 'asc'), orderBy('price', 'asc')];
  if (category) constraints.unshift(where('type', '==', category));

  const q = query(collection(db, SHOP_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShopItem));
}

export async function getShopItemById(itemId: string): Promise<ShopItem | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, SHOP_COLLECTION, itemId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ShopItem) : null;
}

export async function getFeaturedItems(): Promise<ShopItem[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(
    collection(db, SHOP_COLLECTION),
    where('available', '==', true),
    where('featured', '==', true),
    orderBy('sortOrder', 'asc'),
    limit(6),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShopItem));
}

// ---- DevCoin Balance ----

export async function getDevCoinBalance(userId: string): Promise<number> {
  const { firestore: db } = initializeFirebase();
  if (!db) return 0;
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data().devcoins || 0) : 0;
}

// ---- Purchase ----

export async function purchaseItem(userId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { success: false, error: 'No Firebase' };

  const itemRef = doc(db, SHOP_COLLECTION, itemId);
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists()) return { success: false, error: 'Item not found' };

  const item = itemSnap.data() as ShopItem;
  if (!item.available) return { success: false, error: 'Item not available' };
  if (item.currency !== 'devcoins') return { success: false, error: 'Invalid currency' };

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return { success: false, error: 'User not found' };

  const userData = userSnap.data();
  const balance = userData.devcoins || 0;
  if (balance < item.price) return { success: false, error: 'Insufficient DevCoins' };

  const inventoryRef = doc(db, 'users', userId, 'inventory', INVENTORY_DOC);
  const inventorySnap = await getDoc(inventoryRef);

  if (inventorySnap.exists()) {
    const invData = inventorySnap.data();
    const ownedItems: string[] = invData.items || [];
    if (ownedItems.includes(itemId)) return { success: false, error: 'Already owned' };
  }

  await updateDoc(userRef, { devcoins: increment(-item.price) });

  const purchaseRecord: Omit<PurchaseRecord, 'id'> = {
    userId,
    itemId,
    itemName: item.name,
    itemType: item.type,
    itemRarity: item.rarity,
    price: item.price,
    purchasedAt: now(),
  };
  await addDoc(collection(db, 'users', userId, 'purchaseHistory'), purchaseRecord);

  if (inventorySnap.exists()) {
    await updateDoc(inventoryRef, { items: arrayUnion(itemId) });
  } else {
    await setDoc(inventoryRef, { userId, items: [itemId], equipped: {} });
  }

  return { success: true };
}

// ---- Inventory ----

export async function getInventory(userId: string): Promise<UserInventory | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId, 'inventory', INVENTORY_DOC));
  return snap.exists() ? ({ userId, ...snap.data() } as UserInventory) : null;
}

export async function getOwnedItems(userId: string): Promise<ShopItem[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const inv = await getInventory(userId);
  if (!inv || !inv.items.length) return [];

  const items: ShopItem[] = [];
  for (const itemId of inv.items) {
    const item = await getShopItemById(itemId);
    if (item) items.push(item);
  }
  return items;
}

export async function equipItem(userId: string, itemId: string): Promise<boolean> {
  const { firestore: db } = initializeFirebase();
  if (!db) return false;

  const inventoryRef = doc(db, 'users', userId, 'inventory', INVENTORY_DOC);
  const [itemSnap, invSnap] = await Promise.all([
    getDoc(doc(db, SHOP_COLLECTION, itemId)),
    getDoc(inventoryRef),
  ]);
  if (!itemSnap.exists()) return false;
  if (!invSnap.exists()) return false;

  const item = itemSnap.data() as ShopItem;
  const invData = invSnap.data();
  if (!(invData.items || []).includes(itemId)) return false;

  await updateDoc(inventoryRef, { [`equipped.${item.type}`]: itemId });
  return true;
}

export async function unequipItem(userId: string, itemType: ShopItemType): Promise<boolean> {
  const { firestore: db } = initializeFirebase();
  if (!db) return false;

  const inventoryRef = doc(db, 'users', userId, 'inventory', INVENTORY_DOC);
  const invSnap = await getDoc(inventoryRef);
  if (!invSnap.exists()) return false;

  await updateDoc(inventoryRef, { [`equipped.${itemType}`]: '' });
  return true;
}

export async function isItemOwned(userId: string, itemId: string): Promise<boolean> {
  const inv = await getInventory(userId);
  if (!inv) return false;
  return (inv.items || []).includes(itemId);
}

// ---- Purchase History ----

export async function getPurchaseHistory(userId: string, max: number = 50): Promise<PurchaseRecord[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(
    collection(db, 'users', userId, 'purchaseHistory'),
    orderBy('purchasedAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseRecord));
}

// ---- DevCoin Earning ----

export async function recordEarning(
  userId: string,
  source: DevCoinSource,
  description: string,
  metadata?: Record<string, any>,
): Promise<{ success: boolean; amount: number; error?: string }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { success: false, amount: 0, error: 'No Firebase' };

  const limitConfig = EARNING_LIMITS.find(l => l.source === source);
  if (!limitConfig) return { success: false, amount: 0, error: 'Unknown source' };

  const amount = limitConfig.amountPerEvent;

  if (limitConfig.cooldownMinutes && limitConfig.cooldownMinutes > 0) {
    const cooldownMs = limitConfig.cooldownMinutes * 60 * 1000;
    const recentQ = query(
      collection(db, 'users', userId, 'earnings'),
      where('source', '==', source),
      orderBy('earnedAt', 'desc'),
      limit(1),
    );
    const recentSnap = await getDocs(recentQ);
    if (!recentSnap.empty) {
      const lastEarning = recentSnap.docs[0].data() as DevCoinEarning;
      const lastTime = new Date(lastEarning.earnedAt).getTime();
      if (Date.now() - lastTime < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - (Date.now() - lastTime)) / 60000);
        return { success: false, amount: 0, error: `Cooldown active — wait ${remaining}min` };
      }
    }
  }

  const today = todayStart();
  const week = weekStart();

  const [dailyEarnings, weeklyEarnings] = await Promise.all([
    getDocs(query(
      collection(db, 'users', userId, 'earnings'),
      where('source', '==', source),
      where('earnedAt', '>=', today),
    )),
    getDocs(query(
      collection(db, 'users', userId, 'earnings'),
      where('source', '==', source),
      where('earnedAt', '>=', week),
    )),
  ]);

  let dailyTotal = 0;
  dailyEarnings.forEach(d => { dailyTotal += (d.data() as DevCoinEarning).amount; });
  let weeklyTotal = 0;
  weeklyEarnings.forEach(d => { weeklyTotal += (d.data() as DevCoinEarning).amount; });

  if (limitConfig.dailyMax > 0 && dailyTotal + amount > limitConfig.dailyMax) {
    return { success: false, amount: 0, error: `Daily limit reached for ${source}` };
  }
  if (limitConfig.weeklyMax > 0 && weeklyTotal + amount > limitConfig.weeklyMax) {
    return { success: false, amount: 0, error: `Weekly limit reached for ${source}` };
  }

  const earning: Omit<DevCoinEarning, 'id'> = {
    userId,
    amount,
    source,
    description,
    earnedAt: now(),
    metadata,
  };

  await Promise.all([
    addDoc(collection(db, 'users', userId, 'earnings'), earning),
    updateDoc(doc(db, 'users', userId), { devcoins: increment(amount) }),
  ]);

  return { success: true, amount };
}

export async function getRecentEarnings(userId: string, max: number = 20): Promise<DevCoinEarning[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(
    collection(db, 'users', userId, 'earnings'),
    orderBy('earnedAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DevCoinEarning));
}

export async function getTotalDevCoinsEarned(userId: string): Promise<number> {
  const { firestore: db } = initializeFirebase();
  if (!db) return 0;
  const snap = await getDocs(collection(db, 'users', userId, 'earnings'));
  let total = 0;
  snap.forEach(d => { total += (d.data() as DevCoinEarning).amount; });
  return total;
}
