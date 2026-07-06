'use client';

import { useState, useEffect, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  collection, query, orderBy, onSnapshot,
} from 'firebase/firestore';
import type { PracticeProblemDocument, UserPracticeProgress, Difficulty } from '@/types';
import {
  fetchProblems, getAllUserProgress, toggleBookmark as fbToggleBookmark,
  fetchRecentlyViewed, trackRecentlyViewed,
} from '@/services/practice';
import { enrichAllProblems } from '@/lib/problem-utils';

export function usePracticeProblems() {
  const [problems, setProblems] = useState<PracticeProblemDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const staticData = enrichAllProblems();
    const { firestore: db } = initializeFirebase();
    if (!db) {
      setProblems(staticData);
      setUsingFallback(true);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'problems'), orderBy('title', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const fbData = snap.docs.map(d => ({ id: d.id, ...d.data() } as PracticeProblemDocument));
      if (fbData.length > 0) {
        setProblems(fbData);
        setUsingFallback(false);
      } else {
        setProblems(staticData);
        setUsingFallback(true);
      }
      setLoading(false);
    }, () => {
      setProblems(staticData);
      setUsingFallback(true);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { problems, loading, usingFallback };
}

export function useUserProgress(userId: string | null) {
  const [progress, setProgress] = useState<Record<string, UserPracticeProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const { firestore: db } = initializeFirebase();
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, 'users', userId, 'practiceProgress'));
    const unsub = onSnapshot(q, (snap) => {
      const map: Record<string, UserPracticeProgress> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.lastSubmittedAt?.toDate) {
          data.lastSubmittedAt = data.lastSubmittedAt.toDate().toISOString();
        }
        map[d.id] = { problemId: d.id, ...data } as UserPracticeProgress;
      });
      setProgress(map);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [userId]);

  return { progress, loading };
}

export function useToggleBookmark(userId: string | null) {
  return useCallback(async (problemId: string, current: boolean) => {
    if (!userId) return;
    await fbToggleBookmark(userId, problemId, current);
  }, [userId]);
}

export function useRecentlyViewed(userId: string | null) {
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchRecentlyViewed(userId).then(setRecent).catch((err) => console.error('[Practice] Failed to fetch recently viewed', err)).finally(() => setLoading(false));
  }, [userId]);

  const track = useCallback(async (problem: { id: string; title: string; difficulty: Difficulty }) => {
    if (!userId) return;
    await trackRecentlyViewed(userId, problem);
  }, [userId]);

  return { recent, loading, track };
}
