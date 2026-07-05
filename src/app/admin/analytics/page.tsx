'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getPlatformAnalytics } from '@/services/admin';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformAnalytics().then(data => { setStats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!stats) return <p className="text-sm text-muted-foreground">Failed to load analytics.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-headline font-black uppercase tracking-tighter">Platform Analytics</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
          <p className="text-xs text-muted-foreground">Total Submissions</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{stats.totalProblems}</p>
          <p className="text-xs text-muted-foreground">Total Problems</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{stats.solvedProblems}</p>
          <p className="text-xs text-muted-foreground">Unique Problems Solved</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{(stats.totalXp || 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total XP Earned</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{(stats.totalCoins || 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Coins Earned</p>
        </Card>
      </div>

      <Card className="bg-card/50 border-border">
        <CardHeader><CardTitle className="text-sm">Difficulty Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {Object.entries(stats.byDifficulty || {}).map(([key, value]) => (
              <div key={key} className="flex-1 p-4 rounded-lg bg-muted/30 text-center">
                <p className="text-lg font-bold">{value as number}</p>
                <p className="text-xs text-muted-foreground">{key}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
