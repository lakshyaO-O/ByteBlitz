'use client';

import { useState } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, Loader2, Terminal, Clock,
  Cpu, HardDrive, ChevronDown, ChevronRight, Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TestCaseResult, ExecutionPhase } from '@/types';

const verdictIcon: Record<string, typeof CheckCircle2> = {
  Accepted: CheckCircle2,
  'Wrong Answer': XCircle,
  'Runtime Error': AlertCircle,
  'Compilation Error': Ban,
  'Time Limit Exceeded': Clock,
  'Memory Limit Exceeded': Cpu,
  Pending: Loader2,
};

const verdictConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Accepted: { color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', label: 'Passed' },
  'Wrong Answer': { color: 'text-destructive', bg: 'bg-destructive/8', border: 'border-destructive/20', label: 'Wrong Answer' },
  'Runtime Error': { color: 'text-orange-400', bg: 'bg-orange-500/8', border: 'border-orange-500/20', label: 'Runtime Error' },
  'Compilation Error': { color: 'text-orange-400', bg: 'bg-orange-500/8', border: 'border-orange-500/20', label: 'Compilation Error' },
  'Time Limit Exceeded': { color: 'text-destructive', bg: 'bg-destructive/8', border: 'border-destructive/20', label: 'TLE' },
  'Memory Limit Exceeded': { color: 'text-destructive', bg: 'bg-destructive/8', border: 'border-destructive/20', label: 'MLE' },
  Pending: { color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border/40', label: 'Pending' },
};

export function ExecutionStatus({
  phase, currentTest, totalTests, message,
}: {
  phase: ExecutionPhase;
  currentTest: number;
  totalTests: number;
  message: string;
}) {
  if (phase === 'idle' || phase === 'finished') return null;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
      <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {phase === 'running' && totalTests > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[120px]">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(currentTest / totalTests) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground">{currentTest}/{totalTests}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveTestCase({ index, verdict }: { index: number; verdict?: string }) {
  const config = verdict ? verdictConfig[verdict] : null;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-mono transition-colors',
      config ? `${config.bg} ${config.border} border` : 'bg-muted/10',
    )}>
      {verdict ? (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config?.color.replace('text', 'bg'))} />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground shrink-0" />
      )}
      <span className="text-muted-foreground">Test {index}</span>
      {config && (
        <span className={cn('ml-auto text-xs font-medium', config.color)}>{config.label}</span>
      )}
    </div>
  );
}

function TestCaseDetail({
  result, index, total,
}: {
  result: TestCaseResult;
  index: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const config = verdictConfig[result.verdict] || verdictConfig.Pending;
  const Icon = verdictIcon[result.verdict] || AlertCircle;
  const hasInput = result.input && result.input.length > 0 && result.verdict !== 'Pending';

  return (
    <div className={cn('rounded border overflow-hidden transition-colors', config.border, config.bg)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-left"
      >
        <Icon className={cn('w-4 h-4 shrink-0', result.verdict === 'Pending' ? 'animate-spin text-muted-foreground' : config.color)} />
        <span className="text-sm font-medium font-mono text-foreground">Test {index + 1}</span>
        <span className={cn('text-xs font-medium ml-auto', config.color)}>{config.label}</span>
        {result.executionTimeMs > 0 && (
          <span className="text-xs text-muted-foreground font-mono">{result.executionTimeMs}ms</span>
        )}
        {result.memoryUsedKb > 0 && (
          <span className="text-xs text-muted-foreground font-mono">{result.memoryUsedKb}KB</span>
        )}
        {open ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-border/30">
          <div className="px-3 py-2.5 space-y-2.5 text-sm">
            {result.error && (
              <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {result.error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium border', config.border, config.color)}>
                {config.label}
              </span>
              {result.exitCode !== 0 && (
                <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-muted/20 border border-border/40 text-muted-foreground">
                  Exit: {result.exitCode}
                </span>
              )}
              {result.executionTimeMs > 0 && (
                <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-muted/20 border border-border/40 text-muted-foreground flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {result.executionTimeMs}ms
                </span>
              )}
              {result.memoryUsedKb > 0 && (
                <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-muted/20 border border-border/40 text-muted-foreground flex items-center gap-1">
                  <HardDrive className="w-2.5 h-2.5" /> {result.memoryUsedKb}KB
                </span>
              )}
            </div>

            {hasInput && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Input</span>
                <pre className="mt-0.5 text-xs font-mono bg-background/60 p-2 rounded border border-border/30 overflow-x-auto">{result.input}</pre>
              </div>
            )}

            {result.expectedOutput && result.verdict !== 'Pending' && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Expected</span>
                <pre className={cn('mt-0.5 text-xs font-mono bg-background/60 p-2 rounded border overflow-x-auto', result.passed ? 'border-emerald-500/20' : 'border-destructive/20')}>
                  {result.expectedOutput}
                </pre>
              </div>
            )}

            {!result.passed && result.actualOutput !== undefined && result.verdict !== 'Pending' && (
              <div>
                <span className="text-xs font-medium text-destructive">Actual</span>
                <pre className="mt-0.5 text-xs font-mono bg-destructive/5 p-2 rounded border border-destructive/20 overflow-x-auto">
                  {result.actualOutput || '(empty)'}
                </pre>
              </div>
            )}

            {result.consoleOutput && (
              <div>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Terminal className="w-2.5 h-2.5" /> Console Output
                </span>
                <pre className="mt-0.5 text-xs font-mono bg-background/60 p-2 rounded border border-border/30 overflow-x-auto whitespace-pre-wrap">{result.consoleOutput}</pre>
              </div>
            )}

            {result.stdout && result.stdout !== result.consoleOutput && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">stdout</span>
                <pre className="mt-0.5 text-xs font-mono bg-background/60 p-2 rounded border border-border/30 overflow-x-auto">{result.stdout}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface TestResultsProps {
  results: TestCaseResult[];
  isRunning?: boolean;
  phase?: ExecutionPhase;
  currentTest?: number;
  totalTests?: number;
  phaseMessage?: string;
}

export function TestResults({
  results, isRunning, phase, currentTest, totalTests, phaseMessage,
}: TestResultsProps) {
  if (phase && phase !== 'idle' && phase !== 'finished') {
    return (
      <div className="space-y-2">
        <ExecutionStatus phase={phase} currentTest={currentTest ?? 0} totalTests={totalTests ?? 0} message={phaseMessage ?? ''} />
        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((r, i) => (
              <LiveTestCase key={i} index={i + 1} verdict={r.verdict !== 'Pending' ? r.verdict : undefined} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Running test cases...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        <Terminal className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
        Click <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-xs font-mono">Run</kbd> to execute sample test cases.
      </div>
    );
  }

  const passed = results.filter(r => r.passed).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {passed}/{results.length} passed
          </span>
          {passed === results.length ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-destructive" />
          )}
        </div>
        <span className={cn(
          'text-xs font-medium font-mono',
          passed === results.length ? 'text-emerald-400' : 'text-destructive',
        )}>
          {passed === results.length ? 'All Passed' : `${results.length - passed} failed`}
        </span>
      </div>

      <div className="space-y-1">
        {results.map((result, i) => (
          <TestCaseDetail key={i} result={result} index={i} total={results.length} />
        ))}
      </div>
    </div>
  );
}
