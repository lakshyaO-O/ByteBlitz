'use client';

import { useState, useEffect, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

export interface Opponent {
  id: string;
  username: string;
  rating: number;
  tier: string;
}

export function useMatchmaking(userId: string | null, userRating: number, userTier: string, username?: string) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [eloRange, setEloRange] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const startSearch = useCallback(async () => {
    if (!userId) return;
    setIsSearching(true);
    setSearchTime(0);
    setOpponent(null);
    setError(null);

    try {
      const { firestore: db } = initializeFirebase();
      await setDoc(doc(db, 'matchmaking', userId), {
        userId,
        username: username || 'Player',
        rating: userRating,
        tier: userTier,
        status: 'waiting',
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Start matchmaking error:', err);
      setError('Failed to join matchmaking');
      setIsSearching(false);
    }
  }, [userId, userRating, userTier, username]);

  const cancelSearch = useCallback(async () => {
    if (!userId) return;
    try {
      const { firestore: db } = initializeFirebase();
      await deleteDoc(doc(db, 'matchmaking', userId));
    } catch (err) {
      console.error('Cancel matchmaking error:', err);
    }
    setIsSearching(false);
    setSearchTime(0);
    setOpponent(null);
  }, [userId]);

  useEffect(() => {
    if (!isSearching || !userId) return;
    let unsubscribe: (() => void) | null = null;

    const findMatch = async () => {
      try {
        const { firestore: db } = initializeFirebase();
        const range = eloRange;
        const opponentsQuery = query(
          collection(db, 'matchmaking'),
          where('rating', '>=', userRating - range),
          where('rating', '<=', userRating + range),
          where('status', '==', 'waiting'),
          limit(10)
        );

        unsubscribe = onSnapshot(
          opponentsQuery,
          (snapshot) => {
            const candidates = snapshot.docs
              .map((d: any) => ({ id: d.id, ...d.data() }))
              .filter((d: any) => d.userId !== userId);

            if (candidates.length > 0) {
              const found = candidates[0] as any;
              setOpponent({
                id: found.userId,
                username: found.username,
                rating: found.rating,
                tier: found.tier,
              });
              setIsSearching(false);
              updateDoc(doc(db, 'matchmaking', userId), { status: 'matched' }).catch(() => {});
              updateDoc(doc(db, 'matchmaking', found.userId), { status: 'matched' }).catch(() => {});
            }
          },
          (err) => {
            console.error('Matchmaking listener error:', err);
            setError('Connection error. Please try again.');
          }
        );
      } catch (err: any) {
        console.error('Matchmaking setup error:', err);
        setError('Failed to start matchmaking');
        setIsSearching(false);
      }
    };

    findMatch();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [isSearching, userId, userRating, eloRange]);

  useEffect(() => {
    if (!isSearching) return;
    const timer = setInterval(() => setSearchTime(prev => prev + 1), 1000);
    const rangeTimer = setInterval(() => setEloRange(prev => prev + 50), 2000);
    return () => { clearInterval(timer); clearInterval(rangeTimer); };
  }, [isSearching]);

  return { isSearching, searchTime, opponent, eloRange, error, startSearch, cancelSearch };
}
