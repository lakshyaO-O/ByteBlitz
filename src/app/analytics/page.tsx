'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { WeeklyStats } from '@/components/analytics/WeeklyStats';
import { EmptyState } from '@/components/premium/EmptyState';
import { BarChart3, Activity } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { initializeFirebase } from '@/firebase';
import { collection, query, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { SkeletonPage } from '@/components/common/SkeletonPage';
import { WeeklySummary } from '@/app/lib/types';

export default function AnalyticsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [stats, setStats] = useState({
    weeklyCodingTime: 0,
    problemsSolvedByDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
    languageStats: {} as Record<string, number>,
    winLossHistory: { wins: 0, losses: 0, draws: 0 },
    accuracy: 0,
    totalProblems: 0,
    totalCodingTime: 0,
    performanceTrend: 'stable' as 'up' | 'down' | 'stable',
    winRate: 0,
  });

  const loadAnalytics = useCallback(async () => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return; }
      const userDoc = await getDoc(doc(db, 'users', user!.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const total = data.wins + data.losses + data.draws;
        setStats(prev => ({
          ...prev,
          winLossHistory: { wins: data.wins || 0, losses: data.losses || 0, draws: data.draws || 0 },
          accuracy: data.accuracy || 0,
          totalProblems: data.problemsSolved || 0,
          totalCodingTime: data.totalCodingTime || 0,
          winRate: total > 0 ? Math.round((data.wins / total) * 100) : 0,
        }));
      }
      const sessionsSnap = await getDocs(query(collection(db, 'users', user!.uid, 'codingSessions'), orderBy('startTime', 'desc'), limit(100)));
      const heatmap: Record<string, number> = {};
      const langStats: Record<string, number> = {};
      let weeklyTime = 0;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);

      sessionsSnap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
        const s = d.data();
        const dateKey = s.startTime ? new Date(s.startTime).toISOString().split('T')[0] : '';
        if (dateKey) heatmap[dateKey] = (heatmap[dateKey] || 0) + 1;
        if (s.language) langStats[s.language] = (langStats[s.language] || 0) + 1;
        if (s.startTime && new Date(s.startTime) >= weekAgo) {
          weeklyTime += s.duration || 0;
        }
      });

      setHeatmapData(heatmap);
      setStats(prev => ({ ...prev, weeklyCodingTime: Math.round(weeklyTime / 60), languageStats: langStats }));

      if (Object.keys(heatmap).length > 0) {
        setWeeklySummary({
          weekStart: weekAgo.toISOString(),
          totalCodingTime: weeklyTime,
          problemsSolved: 0,
          matchesPlayed: 0,
          winRate: 0,
          accuracy: 0,
          xpEarned: 0,
          rankChange: 0,
          topTopics: [],
          weakTopics: [],
        } as WeeklySummary);
      }
      } catch (e) { console.warn('[Analytics] Failed to load summary:', e); }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadAnalytics();
  }, [user, loadAnalytics]);

  if (loading) return <SkeletonPage type="analytics" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-headline font-bold">Analytics</h1>
      </div>
      <AnalyticsDashboard
        {...stats}
        codingHeatmapData={heatmapData}
      />
      <WeeklyStats summary={weeklySummary || undefined} />
    </div>
  );
}
