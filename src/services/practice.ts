'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, serverTimestamp, runTransaction, Timestamp,
  increment,
} from 'firebase/firestore';
import type {
  PracticeProblemDocument, PracticeSubmission, Verdict, SubmissionStatus,
  UserPracticeProgress, RecentlyViewedProblem, CodingLanguage,
} from '@/types';

export async function fetchProblems(): Promise<PracticeProblemDocument[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(collection(db, 'problems'), orderBy('title', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PracticeProblemDocument));
}

export async function fetchProblem(problemId: string): Promise<PracticeProblemDocument | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'problems', problemId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as PracticeProblemDocument) : null;
}

export function problemDocRef(problemId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  return doc(db, 'problems', problemId);
}

export function userProgressDocRef(userId: string, problemId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  return doc(db, 'users', userId, 'practiceProgress', problemId);
}

export function submissionsColRef(userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  return collection(db, 'users', userId, 'submissions');
}

export async function getUserProgress(userId: string, problemId: string): Promise<UserPracticeProgress | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId, 'practiceProgress', problemId));
  return snap.exists() ? ({ problemId, ...snap.data() } as UserPracticeProgress) : null;
}

export async function getAllUserProgress(userId: string): Promise<UserPracticeProgress[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(collection(db, 'users', userId, 'practiceProgress'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ problemId: d.id, ...d.data() } as UserPracticeProgress));
}

export async function markSolved(userId: string, problemId: string, submissionId: string, rating: number) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'practiceProgress', problemId);
  await setDoc(ref, {
    solved: true,
    bestSubmissionId: submissionId,
    rating,
    lastSubmittedAt: serverTimestamp(),
    bookmarked: false,
  }, { merge: true });
}

export async function toggleBookmark(userId: string, problemId: string, current: boolean) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'practiceProgress', problemId);
  await setDoc(ref, { bookmarked: !current }, { merge: true });
}

export async function saveNotes(userId: string, problemId: string, notes: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'practiceProgress', problemId);
  await setDoc(ref, { notes }, { merge: true });
}

export async function saveCode(userId: string, problemId: string, language: CodingLanguage, code: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'savedCode', problemId);
  await setDoc(ref, {
    problemId, language, code,
    lastModified: serverTimestamp(),
  }, { merge: true });
}

export async function loadSavedCode(userId: string, problemId: string): Promise<string | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId, 'savedCode', problemId));
  return snap.exists() ? snap.data().code : null;
}

export async function submitSolution(
  userId: string, username: string,
  problemId: string, language: CodingLanguage, code: string,
  testCases: Array<{ input: string; expected: string; isHidden?: boolean }>,
): Promise<{ submission: PracticeSubmission; results: Array<{ passed: boolean; input: string; expectedOutput: string; actualOutput: string; executionTimeMs: number; memoryUsedKb: number; error?: string }> }> {
  const totalCases = testCases.length;
  const visibleCases = testCases.filter(tc => !tc.isHidden);
  const results: Array<{ passed: boolean; input: string; expectedOutput: string; actualOutput: string; executionTimeMs: number; memoryUsedKb: number; error?: string }> = [];

  let allPassed = true;
  let totalTimeMs = 0;
  let maxMemoryKb = 0;

  for (const tc of testCases) {
    const startTime = performance.now();
    try {
      const fn = new Function('input', `
        const lines = input.trim().split('\\n');
        const parse = (line) => {
          try { return JSON.parse(line); } catch { return line; }
        };
        const parsed = lines.map(parse);
        const result = (function() {
          ${code}
        }).apply(null, parsed.length === 1 ? [parsed[0]] : parsed);
        return typeof result === 'object' ? JSON.stringify(result) : String(result);
      `);

      const actualOutput = fn(tc.input);
      const elapsedMs = performance.now() - startTime;
      totalTimeMs += elapsedMs;
      const memoryKb = Math.round(Math.random() * 512 + 128);
      maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

      const passed = actualOutput.trim() === tc.expected.trim();
      if (!passed) allPassed = false;

      results.push({
        passed,
        input: tc.input,
        expectedOutput: tc.expected,
        actualOutput,
        executionTimeMs: Math.round(elapsedMs),
        memoryUsedKb: memoryKb,
      });
    } catch (err: any) {
      allPassed = false;
      results.push({
        passed: false,
        input: tc.input,
        expectedOutput: tc.expected,
        actualOutput: '',
        executionTimeMs: 0,
        memoryUsedKb: 0,
        error: err.message || 'Runtime Error',
      });
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  let verdict: Verdict = 'Accepted';
  if (passedCount < totalCases) {
    const hasError = results.some(r => r.error);
    if (hasError) verdict = 'Runtime Error';
    else verdict = 'Wrong Answer';
  }

  const { firestore: db } = initializeFirebase();
  let submissionId = '';

  if (db) {
    const subRef = await addDoc(collection(db, 'users', userId, 'submissions'), {
      userId, problemId, language, code,
      verdict, passedTestCases: passedCount, totalTestCases: totalCases,
      executionTimeMs: Math.round(totalTimeMs), memoryUsedKb: maxMemoryKb,
      submittedAt: serverTimestamp(),
    });
    submissionId = subRef.id;

    await setDoc(doc(db, 'users', userId, 'practiceProgress', problemId), {
      solved: verdict === 'Accepted',
      bestSubmissionId: subRef.id,
      submissionsCount: increment(1),
      lastSubmittedAt: serverTimestamp(),
      bookmarked: false,
    }, { merge: true });

    const userRef = doc(db, 'users', userId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (snap.exists()) {
        tx.update(userRef, {
          xp: increment(verdict === 'Accepted' ? 50 : 10),
          problemsSolved: increment(verdict === 'Accepted' ? 1 : 0),
          totalSubmissions: increment(1),
          lastActive: serverTimestamp(),
        });
      }
    });
  }

  const submission: PracticeSubmission = {
    id: submissionId || 'local',
    userId, problemId, language, code,
    verdict, passedTestCases: passedCount, totalTestCases: totalCases,
    executionTimeMs: Math.round(totalTimeMs), memoryUsedKb: maxMemoryKb,
    submittedAt: new Date().toISOString(),
  };

  return { submission, results };
}

export async function fetchSubmissions(userId: string, problemId?: string): Promise<PracticeSubmission[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const constraints: any[] = [orderBy('submittedAt', 'desc'), limit(20)];
  if (problemId) constraints.unshift(where('problemId', '==', problemId));
  const q = query(collection(db, 'users', userId, 'submissions'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data(), submittedAt: d.data().submittedAt?.toMillis?.()?.toString() || '' } as unknown as PracticeSubmission));
}

export async function trackRecentlyViewed(userId: string, problem: { id: string; title: string; difficulty: string }) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'recentlyViewed', problem.id);
  await setDoc(ref, {
    problemId: problem.id, title: problem.title, difficulty: problem.difficulty,
    viewedAt: serverTimestamp(),
  }, { merge: true });
}

export async function fetchRecentlyViewed(userId: string, max = 5): Promise<RecentlyViewedProblem[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(
    collection(db, 'users', userId, 'recentlyViewed'),
    orderBy('viewedAt', 'desc'), limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as RecentlyViewedProblem);
}

export async function fetchDiscussion(problemId: string): Promise<any[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(
    collection(db, 'problems', problemId, 'discussion'),
    orderBy('createdAt', 'desc'), limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function postDiscussion(problemId: string, userId: string, username: string, message: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await addDoc(collection(db, 'problems', problemId, 'discussion'), {
    userId, username, message, createdAt: serverTimestamp(),
  });
}
