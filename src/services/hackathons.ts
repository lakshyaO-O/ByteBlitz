'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, increment,
} from 'firebase/firestore';
import type { Hackathon, HackathonTeam } from '@/types';

export async function getHackathons(
  filters?: { status?: string; difficulty?: string; category?: string },
  lastDoc?: any,
): Promise<{ hackathons: Hackathon[]; lastDoc: any }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { hackathons: [], lastDoc: null };

  const constraints: any[] = [orderBy('startDate', 'asc'), limit(20)];
  if (filters?.status) constraints.unshift(where('status', '==', filters.status));
  if (filters?.difficulty) constraints.unshift(where('difficulty', '==', filters.difficulty));
  if (filters?.category) constraints.unshift(where('categories', 'array-contains', filters.category));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, 'hackathons'), ...constraints);
  const snap = await getDocs(q);
  const docs = snap.docs;
  const hackathons = docs.map(d => ({ id: d.id, ...d.data() } as Hackathon));
  return { hackathons, lastDoc: docs[docs.length - 1] || null };
}

export async function getHackathon(id: string): Promise<Hackathon | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const snap = await getDoc(doc(db, 'hackathons', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Hackathon) : null;
}

export async function registerTeam(teamData: Omit<HackathonTeam, 'id' | 'createdAt'>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'hackathonTeams'), {
    ...teamData,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'hackathons', teamData.hackathonId), {
    participants: increment(1),
  });

  return ref.id;
}

export async function getUserHackathons(userId: string): Promise<HackathonTeam[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const q = query(
    collection(db, 'hackathonTeams'),
    where('members', 'array-contains', { userId }),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as HackathonTeam));
}
