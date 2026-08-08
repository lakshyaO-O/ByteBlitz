'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, increment,
  arrayUnion, arrayRemove,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { CommunityPost, PostComment, PostType } from '@/types';

function getFirestore() {
  const { firestore } = initializeFirebase();
  if (!firestore) throw new Error('Firestore not initialized');
  return firestore;
}

export async function createPost(
  postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'likedBy'>,
): Promise<string> {
  const db = getFirestore();

  const ref = await addDoc(collection(db, 'communityPosts'), {
    ...postData,
    likes: 0,
    comments: 0,
    likedBy: [],
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
  const db = getFirestore();

  const constraints: any[] = [orderBy('createdAt', 'desc'), limit(limitCount)];
  if (filters?.type) constraints.unshift(where('type', '==', filters.type));
  if (filters?.tag) constraints.unshift(where('tags', 'array-contains', filters.tag));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, 'communityPosts'), ...constraints);
  const snap = await getDocs(q);
  const docs = snap.docs;
  const posts = docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as CommunityPost;
  });
  return { posts, lastDoc: docs[docs.length - 1] || null };
}

export async function likePost(postId: string, userId: string) {
  const db = getFirestore();
  const ref = doc(db, 'communityPosts', postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { liked: false };

  const data = snap.data();
  const likedBy = data.likedBy || [];
  if (likedBy.includes(userId)) {
    await updateDoc(ref, {
      likes: increment(-1),
      likedBy: arrayRemove(userId),
    });
    return { liked: false };
  } else {
    await updateDoc(ref, {
      likes: increment(1),
      likedBy: arrayUnion(userId),
    });
    return { liked: true };
  }
}

export async function addComment(
  postId: string,
  commentData: Omit<PostComment, 'id' | 'createdAt' | 'likes' | 'postId'>,
): Promise<string> {
  const db = getFirestore();

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
  const db = getFirestore();

  const q = query(
    collection(db, 'communityPosts', postId, 'comments'),
    orderBy('createdAt', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    } as PostComment;
  });
}

export async function deletePost(postId: string, userId: string): Promise<boolean> {
  const db = getFirestore();
  const ref = doc(db, 'communityPosts', postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;

  const data = snap.data();
  if (data.userId !== userId) return false;

  await deleteDoc(ref);
  return true;
}

export async function getUserPosts(userId: string): Promise<CommunityPost[]> {
  const db = getFirestore();

  const q = query(
    collection(db, 'communityPosts'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as CommunityPost;
  });
}

export async function getPostById(postId: string): Promise<CommunityPost | null> {
  const db = getFirestore();
  const snap = await getDoc(doc(db, 'communityPosts', postId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  } as CommunityPost;
}


