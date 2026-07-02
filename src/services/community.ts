'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, increment,
  arrayUnion, arrayRemove,
} from 'firebase/firestore';
import type { CommunityPost, PostComment, PostType } from '@/types';

export async function createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments'>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'communityPosts'), {
    ...postData,
    likes: 0,
    comments: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPosts(
  filters?: { type?: PostType; tag?: string },
  limitCount = 20,
  lastDoc?: any,
): Promise<{ posts: CommunityPost[]; lastDoc: any }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { posts: [], lastDoc: null };

  const constraints: any[] = [orderBy('createdAt', 'desc'), limit(limitCount)];
  if (filters?.type) constraints.unshift(where('type', '==', filters.type));
  if (filters?.tag) constraints.unshift(where('tags', 'array-contains', filters.tag));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, 'communityPosts'), ...constraints);
  const snap = await getDocs(q);
  const docs = snap.docs;
  const posts = docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost));
  return { posts, lastDoc: docs[docs.length - 1] || null };
}

export async function likePost(postId: string, userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const ref = doc(db, 'communityPosts', postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const likedBy = data.likedBy || [];
  if (likedBy.includes(userId)) {
    await updateDoc(ref, {
      likes: increment(-1),
      likedBy: arrayRemove(userId),
    });
  } else {
    await updateDoc(ref, {
      likes: increment(1),
      likedBy: arrayUnion(userId),
    });
  }
}

export async function addComment(postId: string, commentData: Omit<PostComment, 'id' | 'createdAt' | 'likes' | 'postId'>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'communityPosts', postId, 'comments'), {
    ...commentData,
    postId,
    likes: 0,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'communityPosts', postId), {
    comments: increment(1),
  });

  return ref.id;
}

export async function getComments(postId: string): Promise<PostComment[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const q = query(
    collection(db, 'communityPosts', postId, 'comments'),
    orderBy('createdAt', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PostComment));
}

export async function deletePost(postId: string, userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const ref = doc(db, 'communityPosts', postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  if (data.userId !== userId) return;

  await deleteDoc(ref);
}

export async function getUserPosts(userId: string): Promise<CommunityPost[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const q = query(
    collection(db, 'communityPosts'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost));
}
