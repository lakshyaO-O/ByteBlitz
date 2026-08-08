'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { CareerListing, CompanyPrep } from '@/types';

export async function getJobListings(
  filters?: { type?: string; experienceLevel?: string; skills?: string[] },
  lastDoc?: any,
): Promise<{ listings: CareerListing[]; lastDoc: any }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { listings: [], lastDoc: null };

  const constraints: any[] = [
    where('category', '==', 'job'),
    orderBy('createdAt', 'desc'),
    limit(20),
  ];
  if (filters?.type) constraints.unshift(where('type', '==', filters.type));
  if (filters?.experienceLevel) constraints.unshift(where('experienceLevel', '==', filters.experienceLevel));
  if (filters?.skills?.length) constraints.unshift(where('skills', 'array-contains-any', filters.skills));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, 'careerListings'), ...constraints);
  const snap = await getDocs(q);
  const docs = snap.docs;
  const listings = docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as CareerListing));
  return { listings, lastDoc: docs[docs.length - 1] || null };
}

export async function getInternships(
  filters?: { type?: string; skills?: string[] },
  lastDoc?: any,
): Promise<{ listings: CareerListing[]; lastDoc: any }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { listings: [], lastDoc: null };

  const constraints: any[] = [
    where('category', '==', 'internship'),
    orderBy('createdAt', 'desc'),
    limit(20),
  ];
  if (filters?.type) constraints.unshift(where('type', '==', filters.type));
  if (filters?.skills?.length) constraints.unshift(where('skills', 'array-contains-any', filters.skills));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, 'careerListings'), ...constraints);
  const snap = await getDocs(q);
  const docs = snap.docs;
  const listings = docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as CareerListing));
  return { listings, lastDoc: docs[docs.length - 1] || null };
}

export async function getCompanyPrep(companyId: string): Promise<CompanyPrep | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const snap = await getDoc(doc(db, 'companyPrep', companyId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as CompanyPrep) : null;
}

export async function getAllCompanies(): Promise<CompanyPrep[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const q = query(collection(db, 'companyPrep'), orderBy('company', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as CompanyPrep));
}

export async function submitApplication(listingId: string, userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  await addDoc(collection(db, 'applications'), {
    listingId,
    userId,
    status: 'submitted',
    createdAt: serverTimestamp(),
  });
}
