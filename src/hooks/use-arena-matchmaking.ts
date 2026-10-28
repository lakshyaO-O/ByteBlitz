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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchedEntryRef = useRef<MatchmakingEntry | null>(null);

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
        if (entry?.status === 'matched') {
          // Passive side: creator already built the battle with our battleId in our entry.
          matchedEntryRef.current = entry;
          cleanup();
          setStatus('found');
        }
      });

      pollRef.current = setInterval(async () => {
        if (!user?.uid) return;
        if (status !== 'searching') return;
        const found = await findMatch(user.uid, settings).catch(() => null);
        if (found) {
          setStatus('found');
          setOpponent({ uid: found.userId, username: found.username, rating: found.rating, tier: found.tier });
        }
      }, 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to join queue');
      setStatus('error');
    }
  }, [user?.uid, profile, settings, cleanup, status]);

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
    if (!user?.uid || !profile) return;

    // Passive side: the creator already made the battle; join it directly.
    const matchedEntry = matchedEntryRef.current;
    if (matchedEntry?.battleId) {
      setStatus('creating_battle');
      try {
        const b = await fetchBattle(matchedEntry.battleId);
        if (!b) throw new Error('Battle could not be loaded');
        setBattle(b);
        setProblem({
          id: b.problem.id,
          title: b.problem.title,
          difficulty: b.problem.difficulty as any,
          category: b.problem.category || '',
          points: b.problem.points || 100,
          description: b.problem.description,
          constraints: b.problem.constraints || [],
          examples: b.problem.examples || [],
          starterCode: b.problem.starterCode || {},
        });
        if (!opponent) {
          setOpponent(
            b.player1?.userId === user.uid
              ? { uid: b.player2?.userId || '', username: b.player2?.username || 'Player', rating: b.player2?.rating || 800, tier: b.player2?.tier || 'Beginner' }
              : { uid: b.player1?.userId || '', username: b.player1?.username || 'Player', rating: b.player1?.rating || 800, tier: b.player1?.tier || 'Beginner' },
          );
        }
        setStatus('ready');
      } catch (e: any) {
        setError(e?.message || 'Failed to join battle');
        setStatus('error');
      }
      return;
    }

    if (!opponent) return;
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
