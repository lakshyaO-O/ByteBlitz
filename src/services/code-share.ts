'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, increment,
} from 'firebase/firestore';
import type { CodeShare } from '@/types';

export async function shareCode(codeShareData: Omit<CodeShare, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'forks' | 'views'>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'codeShares'), {
    ...codeShareData,
    likes: 0,
    forks: 0,
    views: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getSharedCodes(
  filters?: { language?: string; tags?: string[] },
  lastDoc?: any,
): Promise<{ codes: CodeShare[]; lastDoc: any }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { codes: [], lastDoc: null };

  const constraints: any[] = [
    where('isPublic', '==', true),
    orderBy('likes', 'desc'),
    limit(20),
  ];
  if (filters?.language) constraints.unshift(where('language', '==', filters.language));
  if (filters?.tags?.length) constraints.unshift(where('tags', 'array-contains-any', filters.tags));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, 'codeShares'), ...constraints);
  const snap = await getDocs(q);
  const docs = snap.docs;
  const codes = docs.map(d => ({ id: d.id, ...d.data() } as CodeShare));
  return { codes, lastDoc: docs[docs.length - 1] || null };
}

export async function getCode(id: string): Promise<CodeShare | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = doc(db, 'codeShares', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  await updateDoc(ref, { views: increment(1) });
  return { id: snap.id, ...snap.data() } as CodeShare;
}

export async function forkCode(id: string, userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const originalSnap = await getDoc(doc(db, 'codeShares', id));
  if (!originalSnap.exists()) return null;

  const original = originalSnap.data() as CodeShare;
  const ref = await addDoc(collection(db, 'codeShares'), {
    title: `${original.title} (fork)`,
    description: original.description,
    code: original.code,
    language: original.language,
    tags: original.tags,
    userId,
    username: original.username,
    photoURL: original.photoURL,
    likes: 0,
    forks: 0,
    views: 0,
    isPublic: true,
    forkedFrom: id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'codeShares', id), { forks: increment(1) });
  return ref.id;
}

export async function deleteCode(id: string, userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const ref = doc(db, 'codeShares', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  if (data.userId !== userId) return;

  await deleteDoc(ref);
}
