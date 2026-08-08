'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Loader2, Users, Activity, TrendingUp, CheckCircle, XCircle,
  MessageSquare, AlertTriangle, BarChart3, Globe, Cpu, RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAuth } from 'firebase/auth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';

interface AnalyticsData {
  activeUsers: {
    daily: number; weekly: number; monthly: number;
    dailySeries: { date: string; count: number }[];
  };
  growth: {
    newUsersToday: number; newUsersThisWeek: number; newUsersThisMonth: number;
    totalUsers: number; signupsSeries: { date: string; count: number }[];
  };
  retention: {
    day7: number; day30: number; cohortSize: number; cohortRetained: number;
    cohort30Size: number; cohort30Retained: number;
  };
  problems: {
    totalSubmissions: number; totalAccepted: number; acceptanceRate: number;
    mostSolved: { problemId: string; title: string; solved: number; total: number; acceptanceRate: number }[];
    mostFailed: { problemId: string; title: string; solved: number; total: number; acceptanceRate: number }[];
    dailySubmissions: { date: string; count: number; accepted: number }[];
  };
  languages: { language: string; count: number; accepted: number }[];
  aiUsage: {
    totalCalls: number; mentor: number; codeReview: number; debugger: number;
    interviewer: number; roadmap: number; resumeReview: number; usersWithAi: number;
  };
  community: {
    totalPosts: number; totalThreads: number; totalComments: number;
    dailySeries: { date: string; count: number }[];
  };
  traffic: {
    activeByHour: { hour: number; count: number }[];
    dailyActiveSeries: { date: string; count: number }[];
  };
  reports: {
    pending: number; total: number;
    dailySeries: { date: string; count: number }[];
  };
}

const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444', '#a855f7', '#f97316', '#06b6d4', '#ec4899', '#84cc16'];

const CHART_PROPS = { width: '100%' as const, height: 250 };

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  if (!data) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load analytics</p>
        </CardContent>
      </Card>
    );
  }

  const sections = [
    renderActiveUsers(data),
    renderGrowth(data),
    renderRetention(data),
    renderProblems(data),
    renderMostSolvedFailed(data),
    renderLanguages(data),
    renderAIUsage(data),
    renderCommunity(data),
    renderTraffic(data),
    renderReports(data),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-headline font-black uppercase tracking-tighter">Analytics</h2>
          <span className="text-[10px] text-muted-foreground font-mono">Platform metrics & trends</span>
        </div>
        <ButtonIcon onClick={fetchData} />
      </div>

      {sections.map((section, i) => (
        <div key={i}>{section}</div>
      ))}
    </div>
  );
}

function ButtonIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 hover:bg-muted rounded-md transition-colors"
    >
      <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
    </button>
  );
}

function renderActiveUsers(d: AnalyticsData) {
  return (
    <div>
      <SectionHeader icon={Users} title="Active Users" />
      <div className="grid grid-cols-3 gap-2 mb-3">
        <MetricCard label="Daily (DAU)" value={d.activeUsers.daily.toLocaleString()} />
        <MetricCard label="Weekly (WAU)" value={d.activeUsers.weekly.toLocaleString()} />
        <MetricCard label="Monthly (MAU)" value={d.activeUsers.monthly.toLocaleString()} />
      </div>
      <ChartCard>
        <ResponsiveContainer {...CHART_PROPS}>
          <AreaChart data={d.activeUsers.dailySeries}>
            <defs>
              <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tickFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
              labelFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }}
            />
            <Area type="monotone" dataKey="count" stroke="#22c55e" fill="url(#activeGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function renderGrowth(d: AnalyticsData) {
  return (
    <div>
      <SectionHeader icon={TrendingUp} title="Growth" />
      <div className="grid grid-cols-4 gap-2 mb-3">
        <MetricCard label="Today" value={d.growth.newUsersToday.toLocaleString()} />
        <MetricCard label="This Week" value={d.growth.newUsersThisWeek.toLocaleString()} />
        <MetricCard label="This Month" value={d.growth.newUsersThisMonth.toLocaleString()} />
        <MetricCard label="Total Users" value={d.growth.totalUsers.toLocaleString()} />
      </div>
      <ChartCard>
        <ResponsiveContainer {...CHART_PROPS}>
          <BarChart data={d.growth.signupsSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tickFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
              labelFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function renderRetention(d: AnalyticsData) {
  return (
    <div>
      <SectionHeader icon={Activity} title="Retention" />
      <div className="grid grid-cols-2 gap-2 mb-3">
        <MetricCard label="Day 7 Retention" value={`${d.retention.day7}%`} subtitle={`${d.retention.cohortRetained}/${d.retention.cohortSize}`} />
        <MetricCard label="Day 30 Retention" value={`${d.retention.day30}%`} subtitle={`${d.retention.cohort30Retained}/${d.retention.cohort30Size}`} />
      </div>
      <ChartCard>
        <ResponsiveContainer {...CHART_PROPS}>
          <BarChart data={[
            { label: 'Day 7', rate: d.retention.day7 },
            { label: 'Day 30', rate: d.retention.day30 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" unit="%" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
              formatter={(value: any) => [`${value}%`, 'Retention']}
            />
            <Bar dataKey="rate" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function renderProblems(d: AnalyticsData) {
  return (
    <div>
      <SectionHeader icon={CheckCircle} title="Problems Solved" />
      <div className="grid grid-cols-3 gap-2 mb-3">
        <MetricCard label="Total Submissions" value={d.problems.totalSubmissions.toLocaleString()} />
        <MetricCard label="Accepted" value={d.problems.totalAccepted.toLocaleString()} color="emerald" />
        <MetricCard label="Acceptance Rate" value={`${d.problems.acceptanceRate}%`} />
      </div>
      <ChartCard>
        <ResponsiveContainer {...CHART_PROPS}>
          <BarChart data={d.problems.dailySubmissions}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tickFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
              labelFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }}
            />
            <Bar dataKey="accepted" name="Accepted" fill="#22c55e" stackId="a" radius={[2, 2, 0, 0]} />
            <Bar dataKey="count" name="Total" fill="#3b82f6" stackId="b" radius={[2, 2, 0, 0]} opacity={0.3} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function renderMostSolvedFailed(d: AnalyticsData) {
  if (d.problems.mostSolved.length === 0 && d.problems.mostFailed.length === 0) {
    return (
      <div>
        <SectionHeader icon={XCircle} title="Problem Ranking" />
        <ChartCard>
          <p className="text-[10px] text-muted-foreground text-center py-8">No submission data yet</p>
        </ChartCard>
      </div>
    );
  }
  return (
    <div>
      <SectionHeader icon={XCircle} title="Problem Ranking" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {d.problems.mostSolved.length > 0 && (
          <ChartCard>
            <p className="text-[10px] font-medium text-muted-foreground mb-2">Most Solved</p>
            <div className="space-y-1">
              {d.problems.mostSolved.slice(0, 10).map((p, i) => (
                <div key={p.problemId} className="flex items-center gap-2 text-[10px]">
                  <span className="text-muted-foreground w-4 text-right">{i + 1}.</span>
                  <span className="flex-1 truncate">{p.title || p.problemId}</span>
                  <span className="text-emerald-500 font-mono w-10 text-right">{p.solved}</span>
                  <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.acceptanceRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
        {d.problems.mostFailed.length > 0 && (
          <ChartCard>
            <p className="text-[10px] font-medium text-muted-foreground mb-2">Most Failed</p>
            <div className="space-y-1">
              {d.problems.mostFailed.slice(0, 10).map((p, i) => {
                const failed = p.total - p.solved;
                return (
                  <div key={p.problemId} className="flex items-center gap-2 text-[10px]">
                    <span className="text-muted-foreground w-4 text-right">{i + 1}.</span>
                    <span className="flex-1 truncate">{p.title || p.problemId}</span>
                    <span className="text-red-500 font-mono w-10 text-right">{failed}</span>
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${100 - p.acceptanceRate}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function renderLanguages(d: AnalyticsData) {
  if (d.languages.length === 0) {
    return (
      <div>
        <SectionHeader icon={Cpu} title="Language Distribution" />
        <ChartCard><p className="text-[10px] text-muted-foreground text-center py-8">No language data yet</p></ChartCard>
      </div>
    );
  }
  return (
    <div>
      <SectionHeader icon={Cpu} title="Language Distribution" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ChartCard>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={d.languages}
                dataKey="count"
                nameKey="language"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {d.languages.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard>
          <p className="text-[10px] font-medium text-muted-foreground mb-2">Per-Language Stats</p>
          <div className="space-y-1.5">
            {d.languages.map(lang => {
              const pct = lang.count > 0 ? Math.round((lang.accepted / lang.count) * 100) : 0;
              return (
                <div key={lang.language} className="flex items-center gap-2 text-[10px]">
                  <span className="w-20 capitalize truncate font-medium">{lang.language}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-16 text-right">{lang.count} subs</span>
                  <span className="text-emerald-500 w-8 text-right font-mono">{pct}%</span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function renderAIUsage(d: AnalyticsData) {
  const aiItems = [
    { name: 'Mentor', value: d.aiUsage.mentor },
    { name: 'Code Review', value: d.aiUsage.codeReview },
    { name: 'Debugger', value: d.aiUsage.debugger },
    { name: 'Interviewer', value: d.aiUsage.interviewer },
    { name: 'Roadmap', value: d.aiUsage.roadmap },
    { name: 'Resume', value: d.aiUsage.resumeReview },
  ].filter(item => item.value > 0);

  return (
    <div>
      <SectionHeader icon={Cpu} title="AI Usage" />
      <div className="grid grid-cols-2 gap-2 mb-3">
        <MetricCard label="Total AI Calls" value={d.aiUsage.totalCalls.toLocaleString()} />
        <MetricCard label="Users Using AI" value={d.aiUsage.usersWithAi.toLocaleString()} />
      </div>
      {aiItems.length > 0 ? (
        <ChartCard>
          <ResponsiveContainer {...CHART_PROPS}>
            <BarChart data={aiItems} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={80} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
              />
              <Bar dataKey="value" fill="#06b6d4" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <ChartCard><p className="text-[10px] text-muted-foreground text-center py-8">No AI usage data yet</p></ChartCard>
      )}
    </div>
  );
}

function renderCommunity(d: AnalyticsData) {
  return (
    <div>
      <SectionHeader icon={MessageSquare} title="Community Growth" />
      <div className="grid grid-cols-3 gap-2 mb-3">
        <MetricCard label="Posts" value={d.community.totalPosts.toLocaleString()} />
        <MetricCard label="Forum Threads" value={d.community.totalThreads.toLocaleString()} />
        <MetricCard label="Comments" value={d.community.totalComments.toLocaleString()} />
      </div>
      <ChartCard>
        <ResponsiveContainer {...CHART_PROPS}>
          <AreaChart data={d.community.dailySeries}>
            <defs>
              <linearGradient id="communityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tickFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
              labelFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }}
            />
            <Area type="monotone" dataKey="count" stroke="#a855f7" fill="url(#communityGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function renderTraffic(d: AnalyticsData) {
  const hasTraffic = d.traffic.activeByHour.some(h => h.count > 0);
  return (
    <div>
      <SectionHeader icon={Globe} title="Traffic" />
      {hasTraffic ? (
        <ChartCard>
          <ResponsiveContainer {...CHART_PROPS}>
            <BarChart data={d.traffic.activeByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tickFormatter={(h: number) => `${h}:00`} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                labelFormatter={(h: any) => `${h}:00`}
              />
              <Bar dataKey="count" fill="#f97316" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <ChartCard><p className="text-[10px] text-muted-foreground text-center py-8">No traffic data yet</p></ChartCard>
      )}
      <div className="mt-2">
        <ChartCard>
          <p className="text-[10px] font-medium text-muted-foreground mb-2">Daily Active Users (30 days)</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={d.traffic.dailyActiveSeries}>
              <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={1.5} dot={false} />
              <XAxis dataKey="date" tickFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }} tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                labelFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function renderReports(d: AnalyticsData) {
  return (
    <div>
      <SectionHeader icon={AlertTriangle} title="Reports" />
      <div className="grid grid-cols-2 gap-2 mb-3">
        <MetricCard label="Total Reports" value={d.reports.total.toLocaleString()} />
        <MetricCard label="Pending" value={d.reports.pending.toLocaleString()} color={d.reports.pending > 0 ? 'red' : undefined} />
      </div>
      {d.reports.dailySeries.some(r => r.count > 0) ? (
        <ChartCard>
          <ResponsiveContainer {...CHART_PROPS}>
            <AreaChart data={d.reports.dailySeries}>
              <defs>
                <linearGradient id="reportsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                labelFormatter={(d: any) => { const date = new Date(String(d) + 'T00:00:00'); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }}
              />
              <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#reportsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <ChartCard><p className="text-[10px] text-muted-foreground text-center py-8">No reports data yet</p></ChartCard>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <h3 className="text-xs font-headline font-bold uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function MetricCard({ label, value, color, subtitle }: { label: string; value: string; color?: string; subtitle?: string }) {
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-3">
        <p className={cn('text-lg font-bold font-mono tracking-tight', color ? `text-${color}-500` : 'text-foreground')}>
          {value}
        </p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
        {subtitle && <p className="text-[8px] text-muted-foreground/60 mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-3">
        {children}
      </CardContent>
    </Card>
  );
}
