'use client';

import { useMemo } from 'react';
import { getUnlockedDifficulties } from '@/services/practice';
import type { Difficulty } from '@/types';

export function useProgressiveUnlocking(userId: string | null, totalSolved: number, isBeginner: boolean) {
  const unlockedDifficulties = useMemo<Difficulty[]>(() => {
    return getUnlockedDifficulties(totalSolved, isBeginner) as Difficulty[];
  }, [totalSolved, isBeginner]);

  const canAccess = (difficulty: Difficulty): boolean => {
    return unlockedDifficulties.includes(difficulty);
  };

  const unlockProgress = useMemo(() => {
    const thresholds = [
      { difficulty: 'Medium' as Difficulty, solvesRequired: 10, current: totalSolved },
      { difficulty: 'Hard' as Difficulty, solvesRequired: 30, current: totalSolved },
    ];
    return thresholds.map(t => ({
      difficulty: t.difficulty,
      unlocked: unlockedDifficulties.includes(t.difficulty),
      progress: Math.min(100, Math.round((t.current / t.solvesRequired) * 100)),
      current: t.current,
      required: t.solvesRequired,
    }));
  }, [unlockedDifficulties, totalSolved]);

  return { unlockedDifficulties, canAccess, unlockProgress };
}
