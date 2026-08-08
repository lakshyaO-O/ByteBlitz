'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useArenaSettings } from '@/hooks/use-arena-settings';
import {
  joinMatchmakingQueue, leaveMatchmakingQueue, subscribeMatchmaking,
  findMatch, fetchBattle,
} from '@/services/arena';
import { fetchProblem } from '@/services/practice';
import type { MatchmakingEntry, BattleDocument, Problem, Tier } from '@/types';

type MatchmakingStatus =
  | 'idle'
  | 'joining'
  | 'searching'
  | 'found'
  | 'creating_battle'
  | 'ready'
  | 'error';

export function useArenaMatchmaking() {
  const { user } = useUser();
  const { settings } = useArenaSettings();
  const [profile, setProfile] = useState<{ username: string; rating: number; tier: string } | null>(null);
  const [status, setStatus] = useState<MatchmakingStatus>('idle');
  const [opponent, setOpponent] = useState<{ uid: string; username: string; rating: number; tier: string } | null>(null);
  const [battle, setBattle] = useState<BattleDocument | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queueTime, setQueueTime] = useState(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user?.uid) { setProfile(null); return; }
    let mounted = true;
    const { firestore: db } = initializeFirebase();
    if (!db) return;
    getDoc(doc(db, 'users', user.uid)).then((snap: DocumentSnapshot<DocumentData>) => {
      if (snap.exists() && mounted) {
        const d = snap.data();
        setProfile({
          username: d.username || user.displayName || 'Player',
          rating: d.rating || 800,
          tier: d.tier || 'Beginner',
        });
      }
    });
    return () => { mounted = false; };
  }, [user?.uid, user?.displayName]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const joinQueue = useCallback(async () => {
    if (!user?.uid || !profile) return;
    cleanup();
    setStatus('joining');
    setError(null);
    setBattle(null);
    setOpponent(null);
    setQueueTime(0);

    try {
      await joinMatchmakingQueue(user.uid, {
        userId: user.uid,
        username: profile.username,
        rating: profile.rating,
        tier: profile.tier as Tier,
        preferredLanguage: settings.preferredLanguage,
        rated: settings.rated,
        difficulty: settings.difficulty,
        category: settings.category,
        timeControl: settings.timeControl,
        region: settings.region,
        eloRange: settings.eloRange,
      });
      setStatus('searching');

      timerRef.current = setInterval(() => {
        setQueueTime(prev => prev + 1);
      }, 1000);

      unsubscribeRef.current = subscribeMatchmaking(user.uid, (entry) => {
        if (!entry || entry.status === 'matched') {
          if (entry?.status === 'matched') {
            cleanup();
            setStatus('found');
          }
        }
      });

      const pollForMatch = setInterval(async () => {
        if (!user?.uid) return;
        const found = await findMatch(user.uid, settings);
        if (found) {
          clearInterval(pollForMatch);
          cleanup();
          setStatus('found');
          setOpponent({ uid: found.userId, username: found.username, rating: found.rating, tier: found.tier });
        }
      }, 3000);
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }, [user?.uid, profile, settings, cleanup]);

  const leaveQueue = useCallback(async () => {
    if (!user?.uid) return;
    cleanup();
    try {
      await leaveMatchmakingQueue(user.uid);
    } catch { /* noop */ }
    setStatus('idle');
    setOpponent(null);
    setQueueTime(0);
  }, [user?.uid, cleanup]);

  const acceptMatch = useCallback(async () => {
    if (!user?.uid || !opponent || !profile) return;
    setStatus('creating_battle');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/battles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          opponentId: opponent.uid || '',
          rated: settings.rated,
          timeControl: settings.timeControl,
          language: settings.preferredLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create battle');

      if (data.battleId) {
        const battleDoc = await fetchBattle(data.battleId);
        if (battleDoc) {
          setBattle(battleDoc);
        }
        setProblem({
          id: data.problem.id,
          title: data.problem.title,
          difficulty: data.problem.difficulty as any,
          category: '',
          points: 100,
          description: data.problem.description,
          constraints: [],
          examples: data.problem.examples || [],
          starterCode: data.problem.starterCode,
        });
        setStatus('ready');
      }
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }, [user, opponent, profile, settings]);

  return {
    status, opponent, battle, problem, error, queueTime,
    joinQueue, leaveQueue, acceptMatch,
  };
}
