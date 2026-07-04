'use client';

import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Cpu, HardDrive,
  Loader2, Terminal, FileText, Ban, Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Verdict, SubmissionStatus, ExecutionPhase } from '@/types';

interface SubmissionResultProps {
  verdict: Verdict | null;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  compileTimeMs?: number;
  codeSize?: number;
  language?: string;
  submittedAt?: string;
  status: SubmissionStatus;
  phase?: ExecutionPhase;
  phaseMessage?: string;
  testResults?: Array<{ passed: boolean; executionTimeMs: number; memoryUsedKb: number }>;
  problemTimeLimit?: number;
  problemMemoryLimit?: number;
}

const verdictConfig: Record<Verdict, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2; description: string }> = {
  Accepted: {
    label: 'Accepted',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
    description: 'All test cases passed.',
  },
  'Wrong Answer': {
    label: 'Wrong Answer',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    icon: XCircle,
    description: 'Your output did not match the expected result.',
  },
  'Runtime Error': {
    label: 'Runtime Error',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: AlertTriangle,
    description: 'Your code crashed during execution.',
  },
  'Compilation Error': {
    label: 'Compilation Error',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: Ban,
    description: 'Your code failed to compile.',
  },
  'Time Limit Exceeded': {
    label: 'Time Limit Exceeded',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    icon: Clock,
    description: 'Your code exceeded the time limit.',
  },
  'Memory Limit Exceeded': {
    label: 'Memory Limit Exceeded',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    icon: Cpu,
    description: 'Your code exceeded the memory limit.',
  },
};

export function SubmissionResult({
  verdict, passedTestCases, totalTestCases, executionTimeMs, memoryUsedKb,
  compileTimeMs, codeSize, language, submittedAt,
  status, phase, phaseMessage, testResults,
  problemTimeLimit, problemMemoryLimit,
}: SubmissionResultProps) {
  if (status === 'pending' && (!phase || phase === 'idle')) return null;

  if (phase && phase !== 'idle' && phase !== 'finished') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">{phaseMessage || 'Evaluating submission...'}</p>
          {phase === 'running' && (
            <p className="text-xs text-muted-foreground">Processing test cases...</p>
          )}
        </div>
      </div>
    );
  }

  if (!verdict) return null;

  const config = verdictConfig[verdict];
  const Icon = config.icon;
  const passRate = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;
  const timePct = problemTimeLimit && problemTimeLimit > 0 ? Math.min(100, Math.round((executionTimeMs / problemTimeLimit) * 100)) : 0;
  const memPct = problemMemoryLimit && problemMemoryLimit > 0 ? Math.min(100, Math.round((memoryUsedKb / problemMemoryLimit) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className={cn('rounded-lg border p-4', config.bg, config.border)}>
        <div className="flex items-center gap-3">
          <Icon className={cn('w-6 h-6 shrink-0', config.color)} />
          <div>
            <h3 className={cn('text-base font-semibold', config.color)}>{config.label}</h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/30 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Pass Rate</span>
          <span className={cn('text-sm font-medium font-mono', passedTestCases === totalTestCases ? 'text-emerald-400' : 'text-destructive')}>
            {passedTestCases}/{totalTestCases}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              passRate === 100 ? 'bg-emerald-500' : passRate >= 50 ? 'bg-yellow-500' : 'bg-destructive',
            )}
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="rounded-lg border border-border/40 bg-card/20 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Runtime</span>
          </div>
          <p className="text-base font-semibold font-mono tabular-nums">{executionTimeMs >= 0 ? `${executionTimeMs}ms` : 'N/A'}</p>
          {problemTimeLimit && problemTimeLimit > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', timePct > 80 ? 'bg-destructive' : timePct > 50 ? 'bg-yellow-500' : 'bg-emerald-500')} style={{ width: `${timePct}%` }} />
              </div>
              <span className="text-xs font-mono text-muted-foreground">{timePct}%</span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/40 bg-card/20 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Memory</span>
          </div>
          <p className="text-base font-semibold font-mono tabular-nums">{memoryUsedKb > 0 ? `${memoryUsedKb}KB` : 'N/A'}</p>
          {problemMemoryLimit && problemMemoryLimit > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', memPct > 80 ? 'bg-destructive' : memPct > 50 ? 'bg-yellow-500' : 'bg-emerald-500')} style={{ width: `${memPct}%` }} />
              </div>
              <span className="text-xs font-mono text-muted-foreground">{memPct}%</span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/40 bg-card/20 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Language</span>
          </div>
          <p className="text-base font-semibold font-mono tabular-nums">{language || 'N/A'}</p>
        </div>

        {compileTimeMs !== undefined && compileTimeMs > 0 && (
          <div className="rounded-lg border border-border/40 bg-card/20 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Compile</span>
            </div>
            <p className="text-base font-semibold font-mono tabular-nums">{compileTimeMs}ms</p>
          </div>
        )}

        {codeSize !== undefined && codeSize > 0 && (
          <div className="rounded-lg border border-border/40 bg-card/20 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Code Size</span>
            </div>
            <p className="text-base font-semibold font-mono tabular-nums">{(codeSize / 1024).toFixed(1)}KB</p>
          </div>
        )}

        {verdict === 'Accepted' && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400">XP Earned</span>
            </div>
            <p className="text-base font-semibold font-mono tabular-nums text-emerald-400">+50 XP</p>
          </div>
        )}
      </div>
    </div>
  );
}
