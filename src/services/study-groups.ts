'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, increment,
  arrayUnion, arrayRemove,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { StudyGroup, StudyGroupMessage } from '@/types';

export async function createGroup(groupData: Omit<StudyGroup, 'id' | 'createdAt' | 'updatedAt' | 'memberCount'>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'studyGroups'), {
    ...groupData,
    memberCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function joinGroup(groupId: string, userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const ref = doc(db, 'studyGroups', groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  if (data.memberIds.includes(userId)) return;
  if (data.memberIds.length >= data.maxMembers) return;

  await updateDoc(ref, {
    memberIds: arrayUnion(userId),
    memberCount: increment(1),
  });
}

export async function leaveGroup(groupId: string, userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const ref = doc(db, 'studyGroups', groupId);
  await updateDoc(ref, {
    memberIds: arrayRemove(userId),
    memberCount: increment(-1),
  });
}

export async function getGroupMessages(
  groupId: string,
  lastDoc?: any,
): Promise<{ messages: StudyGroupMessage[]; lastDoc: any }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { messages: [], lastDoc: null };

  const constraints: any[] = [
    orderBy('createdAt', 'asc'),
    limit(50),
  ];
  if (lastDoc) constraints.unshift(startAfter(lastDoc));

  const q = query(collection(db, 'studyGroups', groupId, 'messages'), ...constraints);
  const snap = await getDocs(q);
  const docs = snap.docs;
  const messages = docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as StudyGroupMessage));
  return { messages, lastDoc: docs[docs.length - 1] || null };
}

export async function sendMessage(groupId: string, messageData: Omit<StudyGroupMessage, 'id' | 'createdAt' | 'groupId'>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'studyGroups', groupId, 'messages'), {
    ...messageData,
    groupId,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'studyGroups', groupId), {
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function searchGroups(
  queryStr: string,
  filters?: { topic?: string; isPublic?: boolean },
): Promise<StudyGroup[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const constraints: any[] = [orderBy('memberCount', 'desc'), limit(20)];
  if (filters?.topic) constraints.unshift(where('topic', '==', filters.topic));
  if (filters?.isPublic !== undefined) constraints.unshift(where('isPublic', '==', filters.isPublic));

  const q = query(collection(db, 'studyGroups'), ...constraints);
  const snap = await getDocs(q);

  let groups = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as StudyGroup));

  if (queryStr) {
    const lower = queryStr.toLowerCase();
    groups = groups.filter(
      (g: any) => g.name.toLowerCase().includes(lower) || g.description.toLowerCase().includes(lower) || g.tags.some((t: any) => t.toLowerCase().includes(lower)),
    );
  }

  return groups;
}
