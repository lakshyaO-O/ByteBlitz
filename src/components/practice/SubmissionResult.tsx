'use client';

import { CheckCircle2, XCircle, AlertTriangle, Clock, Zap, BarChart3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Verdict, SubmissionStatus } from '@/types';

interface SubmissionResultProps {
  verdict: Verdict | null;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  status: SubmissionStatus;
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

export function SubmissionResult({
  verdict, passedTestCases, totalTestCases, executionTimeMs, memoryUsedKb, status,
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

  return (
    <div className={cn('rounded-xl border p-6 space-y-4', config.bg, config.border)}>
      <div className="flex items-center gap-3">
        <Icon className={cn('w-8 h-8', config.color)} />
        <div>
          <h3 className={cn('text-xl font-bold font-headline', config.color)}>{config.label}</h3>
          <p className="text-xs text-muted-foreground">
            {passedTestCases}/{totalTestCases} test cases passed
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <BarChart3 className={cn('w-4 h-4 mx-auto mb-1', config.color)} />
          <p className="text-lg font-bold font-mono">{passedTestCases}/{totalTestCases}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Passed</p>
        </div>
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <Clock className={cn('w-4 h-4 mx-auto mb-1', config.color)} />
          <p className="text-lg font-bold font-mono">{executionTimeMs}ms</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Time</p>
        </div>
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <Zap className={cn('w-4 h-4 mx-auto mb-1', config.color)} />
          <p className="text-lg font-bold font-mono">{memoryUsedKb}KB</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Memory</p>
        </div>
      </div>
    </div>
  );
}
