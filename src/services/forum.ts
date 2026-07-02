'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, increment,
  arrayUnion,
} from 'firebase/firestore';
import type { DiscussionForum, ForumReply } from '@/types';

export async function createThread(threadData: Omit<DiscussionForum, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'replies' | 'lastActivity'>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'forumThreads'), {
    ...threadData,
    views: 0,
    replies: 0,
    lastActivity: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getThreads(
  category?: string,
  lastDoc?: any,
): Promise<{ threads: DiscussionForum[]; lastDoc: any }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { threads: [], lastDoc: null };

  const constraints: any[] = [orderBy('lastActivity', 'desc'), limit(20)];
  if (category && category !== 'all') constraints.unshift(where('category', '==', category));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, 'forumThreads'), ...constraints);
  const snap = await getDocs(q);
  const docs = snap.docs;
  const threads = docs.map(d => ({ id: d.id, ...d.data() } as DiscussionForum));
  return { threads, lastDoc: docs[docs.length - 1] || null };
}

export async function getThread(id: string): Promise<DiscussionForum | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = doc(db, 'forumThreads', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  await updateDoc(ref, { views: increment(1) });
  return { id: snap.id, ...snap.data() } as DiscussionForum;
}

export async function replyToThread(threadId: string, replyData: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isSolution' | 'threadId'>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'forumThreads', threadId, 'replies'), {
    ...replyData,
    threadId,
    likes: 0,
    isSolution: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'forumThreads', threadId), {
    replies: increment(1),
    lastActivity: serverTimestamp(),
  });

  return ref.id;
}

export async function markSolution(threadId: string, replyId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const replyRef = doc(db, 'forumThreads', threadId, 'replies', replyId);
  await updateDoc(replyRef, { isSolution: true });

  await updateDoc(doc(db, 'forumThreads', threadId), {
    isSolved: true,
  });
}

export async function searchThreads(queryStr: string): Promise<DiscussionForum[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const q = query(
    collection(db, 'forumThreads'),
    orderBy('lastActivity', 'desc'),
    limit(50),
  );
  const snap = await getDocs(q);

  let threads = snap.docs.map(d => ({ id: d.id, ...d.data() } as DiscussionForum));

  if (queryStr) {
    const lower = queryStr.toLowerCase();
    threads = threads.filter(
      t => t.title.toLowerCase().includes(lower) || t.content.toLowerCase().includes(lower) || t.tags.some(tag => tag.toLowerCase().includes(lower)),
    );
  }

  return threads;
}
