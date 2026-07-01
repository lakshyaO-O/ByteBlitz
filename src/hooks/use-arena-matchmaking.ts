'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useArenaSettings } from '@/hooks/use-arena-settings';
import {
  joinMatchmakingQueue, leaveMatchmakingQueue, subscribeMatchmaking,
  findMatch, createBattle, fetchBattle,
} from '@/services/arena.service';
import { fetchProblem } from '@/services/practice.service';
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
  const [opponent, setOpponent] = useState<{ username: string; rating: number; tier: string } | null>(null);
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
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
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
          setOpponent({ username: found.username, rating: found.rating, tier: found.tier });
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
      const sampleProblem: Problem = {
        id: 'arena-sample',
        title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Arrays',
        points: 100,
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
        constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
        examples: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
          { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
        ],
        starterCode: {
          python: 'def two_sum(nums, target):\n    pass',
          javascript: 'function twoSum(nums, target) {\n    \n}',
          typescript: 'function twoSum(nums: number[], target: number): number[] {\n    \n}',
          java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}',
          cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};',
          go: 'func twoSum(nums []int, target int) []int {\n    \n}',
          rust: 'fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n    \n}',
        },
      };

      const battleId = await createBattle(
        {
          userId: user.uid,
          username: profile.username,
          rating: profile.rating,
        tier: profile.tier as Tier,
          language: settings.preferredLanguage,
        },
        {
          userId: '',
          username: opponent.username,
          rating: opponent.rating,
          tier: opponent.tier as Tier,
          language: settings.preferredLanguage,
        },
        sampleProblem,
        settings.rated ? 'ranked' : 'quick',
        settings.timeControl,
        settings.rated,
      );
      if (battleId) {
        const battleDoc = await fetchBattle(battleId);
        if (battleDoc) {
          setBattle(battleDoc);
          setProblem(sampleProblem);
          setStatus('ready');
        }
      }
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }, [user?.uid, opponent, profile, settings]);

  return {
    status, opponent, battle, problem, error, queueTime,
    joinQueue, leaveQueue, acceptMatch,
  };
}
