'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getAIUsageStats } from '@/services/admin';

export default function AdminAIUsagePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAIUsageStats().then(data => { setStats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!stats) return <p className="text-sm text-muted-foreground">Failed to load AI usage stats.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-headline font-black uppercase tracking-tighter">AI Usage Monitoring</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{stats.totalAiCalls}</p>
          <p className="text-xs text-muted-foreground">Total AI Calls</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{stats.mentorCalls}</p>
          <p className="text-xs text-muted-foreground">Mentor Calls</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{stats.reviewCalls}</p>
          <p className="text-xs text-muted-foreground">Code Reviews</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{stats.debugCalls}</p>
          <p className="text-xs text-muted-foreground">Debug Calls</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{stats.interviewerCalls}</p>
          <p className="text-xs text-muted-foreground">Interview Sessions</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{stats.usersWithAi}</p>
          <p className="text-xs text-muted-foreground">Users Using AI</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </Card>
      </div>
    </div>
  );
}
