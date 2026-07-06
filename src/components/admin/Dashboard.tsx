'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import {
  Users, Code2, Send, MessageSquare, Flag,
  CheckCircle, Activity, Loader2, UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickSearch } from '@/components/admin/QuickSearch';

interface DashboardData {
  totalUsers: number;
  activeUsers24h: number;
  totalProblems: number;
  submissionsToday: number;
  communityPosts: number;
  reportsPending: number;
  judgeStatus: string;
  serverHealth: string;
  newestUsers: Array<{
    id: string;
    username: string;
    email: string;
    xp: number;
    tier: string;
    createdAt: string;
  }>;
  newestProblems: Array<{
    id: string;
    title: string;
    difficulty: string;
    category: string;
    createdAt: string;
  }>;
  newestPosts: Array<{
    id: string;
    title: string;
    username: string;
    type: string;
    createdAt: string;
  }>;
  newestReports: Array<{
    id: string;
    reason: string;
    reportedBy: string;
    targetType: string;
    resolved: boolean;
    createdAt: string;
  }>;
}

interface StatCard {
  key: keyof DashboardData;
  label: string;
  icon: any;
  format?: (v: any) => string;
  status?: 'good' | 'warning' | 'error';
}

const STAT_CARDS: StatCard[] = [
  { key: 'totalUsers', label: 'Total Users', icon: Users },
  { key: 'activeUsers24h', label: 'Active Users (24h)', icon: Activity },
  { key: 'totalProblems', label: 'Problems', icon: Code2 },
  { key: 'submissionsToday', label: 'Submissions Today', icon: Send },
  { key: 'communityPosts', label: 'Community Posts', icon: MessageSquare },
  { key: 'reportsPending', label: 'Reports Pending', icon: Flag, status: 'warning' },
  { key: 'judgeStatus', label: 'Judge Status', icon: CheckCircle, format: () => 'Operational', status: 'good' },
  { key: 'serverHealth', label: 'Server Health', icon: Activity, format: () => 'Healthy', status: 'good' },
];

function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-2 animate-pulse">
      <div className="h-3 w-24 bg-foreground/5 rounded" />
      <div className="h-7 w-16 bg-foreground/5 rounded" />
    </div>
  );
}

function StatValue({ value, status }: { value: any; status?: 'good' | 'warning' | 'error' }) {
  if (typeof value === 'string') {
    const colorMap = {
      good: 'text-emerald-600 dark:text-emerald-500',
      warning: 'text-amber-600 dark:text-amber-500',
      error: 'text-red-600 dark:text-red-500',
    };
    return (
      <span className={cn(
        'text-lg font-semibold tracking-tight',
        status ? colorMap[status] : 'text-foreground'
      )}>
        {value}
      </span>
    );
  }
  return (
    <span className="text-lg font-semibold tracking-tight text-foreground">
      {value?.toLocaleString() ?? '—'}
    </span>
  );
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load');
      }

      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="h-64 rounded-lg border border-border bg-background animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <p className="text-sm text-foreground/60">Failed to load dashboard</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <button
            onClick={fetchData}
            className="text-xs text-foreground/60 hover:text-foreground underline underline-offset-2 mt-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Platform overview from real production data
        </p>
      </div>

      {/* Quick Search */}
      <QuickSearch />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map(card => {
          const value = data[card.key as keyof DashboardData];
          const formatted = card.format ? card.format(value) : value;
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="rounded-lg border border-border bg-background p-4 hover:border-foreground/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
                <Icon className="w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
              <StatValue value={formatted} status={card.status} />
            </div>
          );
        })}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Newest Users */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">Newest Users</h2>
            <UserPlus className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>
          <div className="rounded-lg border border-border divide-y divide-border">
            {data.newestUsers.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No users yet</div>
            ) : (
              data.newestUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-foreground/[0.02] transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-medium text-foreground/60">
                        {user.username?.[0] || user.email?.[0] || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {user.username || user.email?.split('@')[0] || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
                    <span>{user.xp} XP</span>
                    <span>{user.tier}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Newest Problems */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">Newest Problems</h2>
            <Code2 className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>
          <div className="rounded-lg border border-border divide-y divide-border">
            {data.newestProblems.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No problems yet</div>
            ) : (
              data.newestProblems.map(problem => (
                <div key={problem.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-foreground/[0.02] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{problem.title}</p>
                    <p className="text-[10px] text-muted-foreground">{problem.category}</p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0',
                    problem.difficulty === 'Easy' && 'text-emerald-600 dark:text-emerald-500 bg-emerald-500/5',
                    problem.difficulty === 'Medium' && 'text-amber-600 dark:text-amber-500 bg-amber-500/5',
                    problem.difficulty === 'Hard' && 'text-red-600 dark:text-red-500 bg-red-500/5',
                  )}>
                    {problem.difficulty}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Newest Posts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">Newest Posts</h2>
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>
          <div className="rounded-lg border border-border divide-y divide-border">
            {data.newestPosts.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No posts yet</div>
            ) : (
              data.newestPosts.map(post => (
                <div key={post.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-foreground/[0.02] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{post.title || 'Untitled'}</p>
                    <p className="text-[10px] text-muted-foreground">by {post.username || 'Unknown'}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground capitalize shrink-0">{post.type}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Newest Reports */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">Newest Reports</h2>
            <Flag className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>
          <div className="rounded-lg border border-border divide-y divide-border">
            {data.newestReports.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No reports yet</div>
            ) : (
              data.newestReports.map(report => (
                <div key={report.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-foreground/[0.02] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{report.reason || 'No reason'}</p>
                    <p className="text-[10px] text-muted-foreground">by {report.reportedBy || 'Unknown'}</p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0',
                    report.resolved
                      ? 'text-emerald-600 dark:text-emerald-500 bg-emerald-500/5'
                      : 'text-amber-600 dark:text-amber-500 bg-amber-500/5',
                  )}>
                    {report.resolved ? 'Resolved' : 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
