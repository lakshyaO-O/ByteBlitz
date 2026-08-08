'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs,
  query, where, orderBy, limit, startAfter, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { DailyFeed } from '@/types';

export async function getFeed(
  userId: string,
  lastDoc?: any,
): Promise<{ feed: DailyFeed['entries']; lastDoc: any }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { feed: [], lastDoc: null };

  const constraints: any[] = [orderBy('createdAt', 'desc'), limit(20)];
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, 'feed'), ...constraints);
  const snap = await getDocs(q);
  const docs = snap.docs;
  const feed = docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as DailyFeed['entries'][0]));
  return { feed, lastDoc: docs[docs.length - 1] || null };
}

export async function getNews(): Promise<DailyFeed['entries']> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const q = query(
    collection(db, 'feed'),
    where('type', '==', 'news'),
    orderBy('createdAt', 'desc'),
    limit(10),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as DailyFeed['entries'][0]));
}

export async function getCodingTips(): Promise<DailyFeed['entries']> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const q = query(
    collection(db, 'feed'),
    where('type', '==', 'coding_tip'),
    orderBy('createdAt', 'desc'),
    limit(10),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as DailyFeed['entries'][0]));
}
