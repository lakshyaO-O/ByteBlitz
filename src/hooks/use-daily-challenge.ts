'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDailyChallenge, getDailyChallengeStatus, claimDailyChallengeXp,
  getWeeklyChallenge, getWeeklyChallengeProgress,
} from '@/services/practice';
import { useAppStore } from '@/store/app-store';

export function useDailyChallenge(userId: string | null) {
  const [daily, setDaily] = useState<{ date: string; problemId: string; xpBonus: number } | null>(null);
  const [status, setStatus] = useState<{ completed: boolean; claimed: boolean; date: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { addXp } = useAppStore();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    Promise.all([
      getDailyChallenge(),
      getDailyChallengeStatus(userId),
    ]).then(([challenge, challengeStatus]) => {
      setDaily(challenge);
      setStatus(challengeStatus);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  const claim = useCallback(async () => {
    if (!userId || !daily || status?.claimed) return;
    await claimDailyChallengeXp(userId, daily.xpBonus);
    addXp(daily.xpBonus);
    setStatus(prev => prev ? { ...prev, claimed: true } : null);
  }, [userId, daily, status, addXp]);

  return { daily, status, loading, claim };
}

export function useWeeklyChallenge(userId: string | null) {
  const [weekly, setWeekly] = useState<{ week: string; problemIds: string[]; xpBonus: number } | null>(null);
  const [progress, setProgress] = useState<{ solved: number; total: number; claimed: boolean }>({ solved: 0, total: 0, claimed: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    Promise.all([
      getWeeklyChallenge(),
      getWeeklyChallengeProgress(userId),
    ]).then(([challenge, prog]) => {
      setWeekly(challenge);
      setProgress(prog);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const prog = await getWeeklyChallengeProgress(userId);
    setProgress(prog);
  }, [userId]);

  return { weekly, progress, loading, refresh };
}
