'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, increment,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { ProjectShowcase } from '@/types';

export async function createProject(projectData: Omit<ProjectShowcase, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views'>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'projects'), {
    ...projectData,
    likes: 0,
    views: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getProjects(userId: string): Promise<ProjectShowcase[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const q = query(
    collection(db, 'projects'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as ProjectShowcase));
}

export async function getAllProjects(
  filters?: { tags?: string[]; technologies?: string[] },
  lastDoc?: any,
): Promise<{ projects: ProjectShowcase[]; lastDoc: any }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { projects: [], lastDoc: null };

  const constraints: any[] = [orderBy('likes', 'desc'), limit(20)];
  if (filters?.tags?.length) constraints.unshift(where('tags', 'array-contains-any', filters.tags));
  if (filters?.technologies?.length) constraints.unshift(where('technologies', 'array-contains-any', filters.technologies));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, 'projects'), ...constraints);
  const snap = await getDocs(q);
  const docs = snap.docs;
  const projects = docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as ProjectShowcase));
  return { projects, lastDoc: docs[docs.length - 1] || null };
}

export async function likeProject(projectId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  await updateDoc(doc(db, 'projects', projectId), {
    likes: increment(1),
  });
}

export async function deleteProject(projectId: string, userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const ref = doc(db, 'projects', projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  if (data.userId !== userId) return;

  await deleteDoc(ref);
}
