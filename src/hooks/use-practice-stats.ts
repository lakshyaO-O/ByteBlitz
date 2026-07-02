'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPracticeStats, checkAndAwardAchievements, getAchievements } from '@/services/practice';
import { useAppStore } from '@/store/app-store';
import type { PracticeSubmission } from '@/types';

export interface PracticeStatsData {
  totalSolved: number;
  totalAttempted: number;
  totalXpEarned: number;
  totalCoinsEarned: number;
  currentStreak: number;
  longestStreak: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  byTopic: Record<string, { solved: number; total: number }>;
  recentSubmissions: PracticeSubmission[];
  fastestSolutions: { problemId: string; time: number }[];
  improvement: { date: string; accuracy: number }[];
  submissions: PracticeSubmission[];
}

export function usePracticeStats(userId: string | null) {
  const [stats, setStats] = useState<PracticeStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const { state } = useAppStore();

  const refresh = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getPracticeStats(userId);
      if (data) setStats(data as PracticeStatsData);
      const earned = await checkAndAwardAchievements(userId, data || {});
      if (earned.length > 0) setNewAchievements(prev => [...prev, ...earned]);
      const all = await getAchievements(userId);
      setAchievements(all);
    } catch { /* ignore */ }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh, state.beginner.problemsSolved]);

  const solvedByDifficulty = {
    Easy: stats?.easySolved || 0,
    Medium: stats?.mediumSolved || 0,
    Hard: stats?.hardSolved || 0,
  };

  const totalSolved = stats?.totalSolved || 0;
  const accuracy = stats?.submissions?.length
    ? Math.round((stats.submissions.filter(s => s.verdict === 'Accepted').length / stats.submissions.length) * 100)
    : 0;

  return {
    stats,
    loading,
    achievements,
    newAchievements,
    refresh,
    solvedByDifficulty,
    totalSolved,
    accuracy,
    dismissNewAchievement: (id: string) => {
      setNewAchievements(prev => prev.filter(a => a.id !== id));
    },
  };
}
