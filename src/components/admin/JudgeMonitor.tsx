'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Loader2, CheckCircle, XCircle, AlertTriangle, Clock, Cpu, RotateCcw,
  Activity, HardDrive, RefreshCw, Zap, Terminal, AlertOctagon, Ban,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAuth } from 'firebase/auth';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface BackendStatus {
  status: string;
  latencyMs: number | null;
  error?: string;
}

interface JudgeHealth {
  status: string;
  backends: {
    piston: BackendStatus;
    judge0: BackendStatus;
  };
}

interface ExecutionStats {
  total: number;
  total24h: number;
  accepted: number;
  failed: number;
  compilationErrors: number;
  runtimeErrors: number;
  timeLimitErrors: number;
  memoryErrors: number;
  wrongAnswer: number;
}

interface QueueStats {
  totalQueued: number;
  running: number;
  pending: number;
}

interface PerfStats {
  avgExecutionTimeMs: number;
  avgMemoryUsedKb: number;
  p50ExecutionTimeMs: number;
  p95ExecutionTimeMs: number;
  p99ExecutionTimeMs: number;
}

interface LanguageStat {
  language: string;
  count: number;
  accepted: number;
}

interface RecentExecution {
  id: string;
  userId: string;
  username: string;
  problemId: string;
  problemTitle: string;
  language: string;
  verdict: string;
  executionTimeMs: number;
  memoryUsedKb: number;
  submittedAt: string;
}

interface MonitoringData {
  health: JudgeHealth;
  queue: QueueStats;
  executions: ExecutionStats;
  performance: PerfStats;
  languages: LanguageStat[];
  recentExecutions: RecentExecution[];
}

const VERDICT_COLORS: Record<string, string> = {
  Accepted: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  'Wrong Answer': 'text-red-500 bg-red-500/10 border-red-500/30',
  'Compilation Error': 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  'Runtime Error': 'text-rose-500 bg-rose-500/10 border-rose-500/30',
  'Time Limit Exceeded': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  'Memory Limit Exceeded': 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  Pending: 'text-muted-foreground bg-muted/20 border-border/50',
};

export function JudgeMonitor() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [confirmRetry, setConfirmRetry] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/judge/monitoring', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRetryAll = async () => {
    setRetrying(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const failedIds = (data?.recentExecutions || [])
        .filter(e => e.verdict !== 'Accepted' && e.verdict !== 'Pending' && e.userId)
        .map(e => ({ userId: e.userId, submissionId: e.id }));

      if (failedIds.length === 0) return;

      await fetch('/api/admin/judge/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'retryFailed', items: failedIds }),
      });

      setConfirmRetry(false);
      fetchData();
    } catch {}
    setRetrying(false);
  };

  const healthColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-emerald-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const healthIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-3 h-3" />;
      case 'degraded': return <AlertTriangle className="w-3 h-3" />;
      case 'down': return <XCircle className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  const failedCount = data ? data.executions.failed : 0;
  const failedItems = data?.recentExecutions?.filter(e =>
    e.verdict !== 'Accepted' && e.verdict !== 'Pending' && e.userId
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-headline font-black uppercase tracking-tighter">Judge Monitor</h2>
          <span className="text-[10px] text-muted-foreground font-mono">Execution engine monitoring</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-7 text-[10px] gap-1">
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : !data ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6 text-center">
            <Cpu className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load judge data</p>
            <Button variant="outline" size="sm" onClick={fetchData} className="mt-2 text-xs">Retry</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Judge Health */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={cn('flex items-center gap-1.5 text-xs font-medium', healthColor(data.health.status))}>
                    {healthIcon(data.health.status)}
                    Judge: {data.health.status === 'operational' ? 'Operational' :
                            data.health.status === 'degraded' ? 'Degraded' :
                            data.health.status === 'down' ? 'Down' : 'Not Configured'}
                  </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-3 text-[10px]">
                  <span className={cn('flex items-center gap-1', healthColor(data.health.backends.piston.status))}>
                    {healthIcon(data.health.backends.piston.status)}
                    Piston {data.health.backends.piston.latencyMs !== null ? `${data.health.backends.piston.latencyMs}ms` : ''}
                  </span>
                  <span className={cn('flex items-center gap-1', healthColor(data.health.backends.judge0.status))}>
                    {healthIcon(data.health.backends.judge0.status)}
                    Judge0 {data.health.backends.judge0.latencyMs !== null ? `${data.health.backends.judge0.latencyMs}ms` : ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue + Execution Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            <StatCard icon={Cpu} label="Total Executions" value={data.executions.total.toLocaleString()} />
            <StatCard icon={Activity} label="Last 24h" value={data.executions.total24h.toLocaleString()} />
            <StatCard icon={CheckCircle} label="Accepted" value={data.executions.accepted.toLocaleString()} color="emerald" />
            <StatCard icon={AlertTriangle} label="Failed" value={failedCount.toLocaleString()} color="red" />
            <StatCard icon={Clock} label="Avg Runtime" value={`${data.performance.avgExecutionTimeMs}ms`} />
            <StatCard icon={HardDrive} label="Avg Memory" value={`${(data.performance.avgMemoryUsedKb / 1024).toFixed(1)}MB`} />
          </div>

          {/* Error Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <ErrorCard icon={Terminal} label="Compilation" value={data.executions.compilationErrors} color="orange" />
            <ErrorCard icon={AlertOctagon} label="Runtime" value={data.executions.runtimeErrors} color="rose" />
            <ErrorCard icon={Zap} label="TLE" value={data.executions.timeLimitErrors} color="yellow" />
            <ErrorCard icon={HardDrive} label="MLE" value={data.executions.memoryErrors} color="purple" />
            <ErrorCard icon={XCircle} label="Wrong Answer" value={data.executions.wrongAnswer} color="red" />
          </div>

          {/* Performance Percentiles */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-4 text-[10px]">
                <span className="text-muted-foreground font-medium">Execution Latency:</span>
                <span>P50: <strong className="text-foreground">{data.performance.p50ExecutionTimeMs}ms</strong></span>
                <span className="text-muted-foreground/40">|</span>
                <span>P95: <strong className="text-foreground">{data.performance.p95ExecutionTimeMs}ms</strong></span>
                <span className="text-muted-foreground/40">|</span>
                <span>P99: <strong className="text-foreground">{data.performance.p99ExecutionTimeMs}ms</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Retry Failed */}
          {failedItems.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <p className="text-[10px] text-red-500/80 flex-1">
                <strong>{failedItems.length}</strong> failed execution{failedItems.length !== 1 ? 's' : ''} available for retry.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmRetry(true)}
                disabled={retrying}
                className="h-7 text-[10px] gap-1 text-red-500 border-red-500/30 hover:bg-red-500/5"
              >
                <RotateCcw className="w-3 h-3" />
                {retrying ? 'Retrying...' : `Retry All (${failedItems.length})`}
              </Button>
            </div>
          )}

          {/* Languages */}
          <div>
            <h3 className="text-xs font-headline font-bold mb-2">Languages</h3>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {data.languages.length === 0 ? (
                    <div className="p-3 text-[10px] text-muted-foreground text-center">No language data</div>
                  ) : (
                    data.languages.map(lang => (
                      <div key={lang.language} className="flex items-center justify-between px-3 py-2">
                        <span className="text-[11px] font-medium capitalize">{lang.language}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground">
                            {lang.accepted}/{lang.count} accepted
                          </span>
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${lang.count > 0 ? (lang.accepted / lang.count) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
              </div>
              <div className="mt-2 pt-2 border-t border-border/30">
                <button
                  onClick={async () => {
                    const btn = document.getElementById('test-connection-btn');
                    if (btn) { btn.textContent = 'Testing...'; (btn as HTMLButtonElement).disabled = true; }
                    try {
                      const auth = getAuth();
                      const token = await auth.currentUser?.getIdToken();
                      const res = await fetch('/api/judge/health', {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      });
                      const info = await res.json();
                      alert(`Judge0: ${info.judge0.reachable ? 'Connected' : 'Unreachable'}${info.judge0.version ? ` (${info.judge0.version})` : ''} ${info.judge0.latencyMs !== null ? `${info.judge0.latencyMs}ms` : ''}\nPiston: ${info.piston.reachable ? 'Connected' : 'Unreachable'}${info.piston.version ? ` (${info.piston.version})` : ''} ${info.piston.latencyMs !== null ? `${info.piston.latencyMs}ms` : ''}\n\n${!info.judge0.configured && !info.piston.configured ? '⚠ No execution backend configured. Set JUDGE0_API_URL or PISTON_API_URL.' : ''}`);
                    } catch (err: any) {
                      alert(`Connection test failed: ${err.message}`);
                    } finally {
                      if (btn) { btn.textContent = 'Test Connection'; (btn as HTMLButtonElement).disabled = false; }
                    }
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  id="test-connection-btn"
                >
                  Test Connection
                </button>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Execution History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-headline font-bold">Execution History</h3>
              <span className="text-[9px] text-muted-foreground font-mono">Last {data.recentExecutions.length} executions</span>
            </div>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                {data.recentExecutions.length === 0 ? (
                  <div className="p-6 text-center">
                    <Cpu className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[11px] text-muted-foreground">No execution history</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {data.recentExecutions.map(ex => (
                      <div key={ex.id} className="px-3 py-2 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0',
                              ex.verdict === 'Accepted' ? 'bg-emerald-500' :
                              ex.verdict === 'Pending' ? 'bg-muted-foreground/30' :
                              'bg-red-500',
                            )} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium truncate">{ex.problemTitle || ex.problemId || 'Unknown'}</span>
                                <span className="text-[9px] text-muted-foreground/60 capitalize">({ex.language})</span>
                              </div>
                              {ex.username && (
                                <p className="text-[9px] text-muted-foreground/50 truncate">{ex.username}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] text-muted-foreground/60">{ex.executionTimeMs}ms</span>
                            <Badge variant="outline" className={cn('text-[8px] px-1.5 py-0', VERDICT_COLORS[ex.verdict] || '')}>
                              {ex.verdict}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmRetry}
        onOpenChange={setConfirmRetry}
        title="Retry Failed Executions"
        description={`Re-queue ${failedItems.length} failed execution${failedItems.length !== 1 ? 's' : ''} for re-evaluation?`}
        confirmLabel={retrying ? 'Retrying...' : 'Retry All'}
        variant="warning"
        onConfirm={handleRetryAll}
        loading={retrying}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
          <Icon className={cn('w-3 h-3', color ? `text-${color}-500/60` : 'text-muted-foreground/40')} />
        </div>
        <span className={cn('text-sm font-bold font-mono', color ? `text-${color}-500` : 'text-foreground')}>
          {value}
        </span>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    orange: 'text-orange-500 bg-orange-500/10',
    rose: 'text-rose-500 bg-rose-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    red: 'text-red-500 bg-red-500/10',
  };
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-3 flex items-center gap-2">
        <Icon className={cn('w-3.5 h-3.5 shrink-0', colorMap[color]?.split(' ')[0] || 'text-muted-foreground')} />
        <div>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider block">{label}</span>
          <span className={cn('text-xs font-bold font-mono', colorMap[color]?.split(' ')[0] || 'text-foreground')}>
            {value.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
