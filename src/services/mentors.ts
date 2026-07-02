'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, increment,
} from 'firebase/firestore';
import type { MentorProfile, MentorReview } from '@/types';

export async function getMentors(
  filters?: { expertise?: string[]; languages?: string[]; available?: boolean },
  lastDoc?: any,
): Promise<{ mentors: MentorProfile[]; lastDoc: any }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { mentors: [], lastDoc: null };

  const constraints: any[] = [orderBy('rating', 'desc'), limit(20)];
  if (filters?.expertise?.length) constraints.unshift(where('expertise', 'array-contains-any', filters.expertise));
  if (filters?.languages?.length) constraints.unshift(where('languages', 'array-contains-any', filters.languages));
  if (filters?.available !== undefined) constraints.unshift(where('available', '==', filters.available));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, 'mentorProfiles'), ...constraints);
  const snap = await getDocs(q);
  const docs = snap.docs;
  const mentors = docs.map(d => ({ id: d.id, ...d.data() } as MentorProfile));
  return { mentors, lastDoc: docs[docs.length - 1] || null };
}

export async function getMentorProfile(userId: string): Promise<MentorProfile | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const q = query(collection(db, 'mentorProfiles'), where('userId', '==', userId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as MentorProfile;
}

export async function createMentorProfile(profileData: Omit<MentorProfile, 'id' | 'createdAt' | 'rating' | 'reviewCount' | 'menteeCount' | 'totalSessions'>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'mentorProfiles'), {
    ...profileData,
    rating: 0,
    reviewCount: 0,
    menteeCount: 0,
    totalSessions: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function addReview(mentorId: string, reviewData: Omit<MentorReview, 'id' | 'createdAt' | 'mentorId'>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'mentorProfiles', mentorId, 'reviews'), {
    ...reviewData,
    mentorId,
    createdAt: serverTimestamp(),
  });

  const reviewsSnap = await getDocs(collection(db, 'mentorProfiles', mentorId, 'reviews'));
  const totalRating = reviewsSnap.docs.reduce((sum, d) => sum + d.data().rating, 0);
  const avgRating = totalRating / reviewsSnap.docs.length;

  await updateDoc(doc(db, 'mentorProfiles', mentorId), {
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: increment(1),
  });

  return ref.id;
}

export async function bookSession(mentorId: string, slotData: { date: string; time: string; userId: string; username: string }) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'mentorProfiles', mentorId, 'sessions'), {
    ...slotData,
    status: 'booked',
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'mentorProfiles', mentorId), {
    totalSessions: increment(1),
    menteeCount: increment(1),
  });

  return ref.id;
}
