'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  limit,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';

export interface Opponent {
  id: string;
  username: string;
  rating: number;
  tier: string;
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Medium',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
    starterCode: 'function twoSum(nums, target) {\n  // Your code here\n}',
    testCases: [
      { nums: [2, 7, 11, 15], target: 9, expected: [0, 1] },
      { nums: [3, 2, 4], target: 6, expected: [1, 2] },
    ],
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'Easy',
    description: 'Write a function that reverses a string. The input string is given as an array of characters.',
    starterCode: 'function reverseString(s) {\n  // Your code here\n}',
    testCases: [
      { s: ['h','e','l','l','o'], expected: ['o','l','l','e','h'] },
      { s: ['H','a','n','n','a','h'], expected: ['h','a','n','n','a','H'] },
    ],
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Medium',
    description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
    starterCode: 'function isValid(s) {\n  // Your code here\n}',
    testCases: [
      { s: '()', expected: true },
      { s: '()[]{}', expected: true },
      { s: '(]', expected: false },
    ],
  },
];

function pickRandomProblem() {
  return PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)];
}

export function useMatchmaking(userId: string | null, userRating: number, userTier: string, username?: string) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [eloRange, setEloRange] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const opponentRef = useRef(opponent);
  opponentRef.current = opponent;
  const isSearchingRef = useRef(isSearching);
  isSearchingRef.current = isSearching;

  const startSearch = useCallback(async () => {
    if (!userId) return;
    setIsSearching(true);
    setSearchTime(0);
    setOpponent(null);
    setError(null);

    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setIsSearching(false); setError('Firebase not available'); return; }
      await setDoc(doc(db, 'matchmaking', userId), {
        userId,
        username: username || 'Player',
        rating: userRating,
        tier: userTier,
        status: 'waiting',
        createdAt: serverTimestamp(),
      });
    } catch {
      setError('Failed to join matchmaking');
      setIsSearching(false);
    }
  }, [userId, userRating, userTier, username]);

  const cancelSearch = useCallback(async () => {
    if (!userId) return;
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      await deleteDoc(doc(db, 'matchmaking', userId));
    } catch {
      // Best-effort cleanup
    }
    setIsSearching(false);
    setSearchTime(0);
    setOpponent(null);
  }, [userId]);

  // Cleanup ghost entries on mount
  useEffect(() => {
    if (!userId) return;
    const { firestore: db } = initializeFirebase();
    if (!db) return;
    deleteDoc(doc(db, 'matchmaking', userId)).catch((err) => console.error('[Matchmaking] Failed to clean up matchmaking doc', err));
  }, [userId]);

  useEffect(() => {
    if (!isSearching || !userId) return;
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const findMatch = async () => {
      try {
        const { firestore: db } = initializeFirebase();
        if (!db) { setIsSearching(false); return; }

        const opponentsQuery = query(
          collection(db, 'matchmaking'),
          where('rating', '>=', userRating - eloRange),
          where('rating', '<=', userRating + eloRange),
          where('status', '==', 'waiting'),
          limit(10)
        );

        unsubscribe = onSnapshot(
          opponentsQuery,
          async (snapshot) => {
            if (!mounted || !isSearchingRef.current || opponentRef.current) return;

            const candidates = snapshot.docs
              .map((d: any) => ({ id: d.id, ...d.data() }))
              .filter((d: any) => d.userId !== userId);

            if (candidates.length === 0) return;
            const found = candidates[0] as any;

            try {
              await runTransaction(db, async (transaction) => {
                const opponentMatchRef = doc(db, 'matchmaking', found.userId);
                const opponentSnap = await transaction.get(opponentMatchRef);

                if (!opponentSnap.exists() || opponentSnap.data().status !== 'waiting') {
                  return;
                }

                const problem = pickRandomProblem();
                const battleRef = doc(collection(db, 'battles'));

                transaction.set(battleRef, {
                  player1: {
                    uid: userId,
                    username: username || 'Player',
                    rating: userRating,
                    score: 0,
                    submitted: false,
                    code: problem.starterCode,
                  },
                  player2: {
                    uid: found.userId,
                    username: found.username,
                    rating: found.rating,
                    score: 0,
                    submitted: false,
                    code: problem.starterCode,
                  },
                  problem: {
                    id: problem.id,
                    title: problem.title,
                    difficulty: problem.difficulty,
                    description: problem.description,
                    starterCode: problem.starterCode,
                    testCases: problem.testCases,
                  },
                  status: 'countdown',
                  roomCode: generateRoomCode(),
                  startedAt: serverTimestamp(),
                  countdownEndsAt: new Date(Date.now() + 5000).toISOString(),
                  duration: 1200,
                  winnerIds: [],
                  finished: false,
                  createdAt: serverTimestamp(),
                });

                transaction.update(doc(db, 'matchmaking', userId), { status: 'matched', battleId: battleRef.id });
                transaction.update(opponentMatchRef, { status: 'matched', battleId: battleRef.id });

                setBattleId(battleRef.id);
                setOpponent({
                  id: found.userId,
                  username: found.username,
                  rating: found.rating,
                  tier: found.tier,
                });
                setIsSearching(false);
              });
            } catch {
              // Transaction failed (race lost or opponent already matched)
            }
          },
          () => {
            setError('Connection error. Please try again.');
          }
        );
      } catch {
        setError('Failed to start matchmaking');
        setIsSearching(false);
      }
    };

    findMatch();
    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isSearching, userId, userRating, eloRange, username]);

  useEffect(() => {
    if (!isSearching) return;
    const timer = setInterval(() => setSearchTime(prev => prev + 1), 1000);
    const rangeTimer = setInterval(() => setEloRange(prev => prev + 50), 2000);
    return () => { clearInterval(timer); clearInterval(rangeTimer); };
  }, [isSearching]);

  return { isSearching, searchTime, opponent, battleId, eloRange, error, startSearch, cancelSearch };
}
