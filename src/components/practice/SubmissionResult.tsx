'use client';

import { CheckCircle2, XCircle, AlertTriangle, Clock, Zap, BarChart3, Loader2, Cpu, HardDrive, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Verdict, SubmissionStatus } from '@/types';

interface SubmissionResultProps {
  verdict: Verdict | null;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  status: SubmissionStatus;
  testResults?: Array<{ passed: boolean; executionTimeMs: number; memoryUsedKb: number }>;
  problemTimeLimit?: number;
  problemMemoryLimit?: number;
}

const verdictConfig: Record<Verdict, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  Accepted: {
    label: 'Accepted',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
  },
  'Wrong Answer': {
    label: 'Wrong Answer',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    icon: XCircle,
  },
  'Runtime Error': {
    label: 'Runtime Error',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: AlertTriangle,
  },
  'Compilation Error': {
    label: 'Compilation Error',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: AlertTriangle,
  },
  'Time Limit Exceeded': {
    label: 'Time Limit Exceeded',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    icon: Clock,
  },
  'Memory Limit Exceeded': {
    label: 'Memory Limit Exceeded',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    icon: Zap,
  },
};

function estimateTimeComplexity(ms: number, testCount: number): string {
  if (testCount === 0 || ms === 0) return '—';
  const avg = ms / testCount;
  if (avg < 0.5) return 'O(1)';
  if (avg < 5) return 'O(log n)';
  if (avg < 50) return 'O(n)';
  if (avg < 200) return 'O(n log n)';
  if (avg < 500) return 'O(n²)';
  return 'O(2ⁿ)';
}

function estimateSpaceComplexity(kb: number): string {
  if (kb === 0) return '—';
  if (kb < 64) return 'O(1)';
  if (kb < 256) return 'O(n)';
  if (kb < 512) return 'O(n²)';
  return 'O(n!)';
}

export function SubmissionResult({
  verdict, passedTestCases, totalTestCases, executionTimeMs, memoryUsedKb, status,
  testResults, problemTimeLimit, problemMemoryLimit,
}: SubmissionResultProps) {
  if (status === 'pending') return null;
  if (status === 'running') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">Evaluating submission...</p>
        </div>
      </div>
    );
  }
  if (!verdict) return null;

  const config = verdictConfig[verdict];
  const Icon = config.icon;
  const passRate = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;
  const avgTime = testResults?.length ? Math.round(executionTimeMs / testResults.length) : executionTimeMs;
  const timePct = problemTimeLimit ? Math.min(100, Math.round((executionTimeMs / problemTimeLimit) * 100)) : 0;
  const memPct = problemMemoryLimit ? Math.min(100, Math.round((memoryUsedKb / problemMemoryLimit) * 100)) : 0;

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', config.bg, config.border)}>
      <div className="flex items-center gap-3">
        <Icon className={cn('w-7 h-7', config.color)} />
        <div>
          <h3 className={cn('text-lg font-bold font-headline', config.color)}>{config.label}</h3>
          <p className="text-xs text-muted-foreground">
            {passedTestCases}/{totalTestCases} test cases passed &middot; {passRate}% pass rate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-background/50 rounded-lg p-2.5 text-center">
          <BarChart3 className={cn('w-3.5 h-3.5 mx-auto mb-0.5', config.color)} />
          <p className="text-base font-bold font-mono">{passedTestCases}/{totalTestCases}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Passed</p>
        </div>
        <div className="bg-background/50 rounded-lg p-2.5 text-center">
          <Clock className={cn('w-3.5 h-3.5 mx-auto mb-0.5', config.color)} />
          <p className="text-base font-bold font-mono">{avgTime}ms</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Avg / case</p>
          {problemTimeLimit && (
            <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
              <div className={cn('h-full rounded-full', timePct > 80 ? 'bg-destructive' : 'bg-emerald-500')} style={{ width: `${timePct}%` }} />
            </div>
          )}
        </div>
        <div className="bg-background/50 rounded-lg p-2.5 text-center">
          <Zap className={cn('w-3.5 h-3.5 mx-auto mb-0.5', config.color)} />
          <p className="text-base font-bold font-mono">{memoryUsedKb}KB</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Memory</p>
          {problemMemoryLimit && (
            <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
              <div className={cn('h-full rounded-full', memPct > 80 ? 'bg-destructive' : 'bg-emerald-500')} style={{ width: `${memPct}%` }} />
            </div>
          )}
        </div>
        <div className="bg-background/50 rounded-lg p-2.5 text-center">
          <Brain className={cn('w-3.5 h-3.5 mx-auto mb-0.5', config.color)} />
          <div className="space-y-0.5">
            <p className="text-[9px] font-mono font-bold">{estimateTimeComplexity(executionTimeMs, totalTestCases)}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Time</p>
            <p className="text-[9px] font-mono font-bold">{estimateSpaceComplexity(memoryUsedKb)}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Space</p>
          </div>
        </div>
      </div>
    </div>
  );
}
