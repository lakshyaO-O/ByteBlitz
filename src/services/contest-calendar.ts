'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, addDoc,
  query, where, orderBy, limit, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { ContestCalendarEntry } from '@/types';

export async function getUpcomingContests(): Promise<ContestCalendarEntry[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const now = new Date().toISOString();
  const q = query(
    collection(db, 'contests'),
    where('startDate', '>=', now),
    orderBy('startDate', 'asc'),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as ContestCalendarEntry));
}

export async function getPastContests(): Promise<ContestCalendarEntry[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const now = new Date().toISOString();
  const q = query(
    collection(db, 'contests'),
    where('endDate', '<', now),
    orderBy('endDate', 'desc'),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as ContestCalendarEntry));
}

export async function addContestReminder(userId: string, contestId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  await addDoc(collection(db, 'users', userId, 'contestReminders'), {
    contestId,
    createdAt: serverTimestamp(),
  });
}
