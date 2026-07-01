'use client';

import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TestCaseResult } from '@/types';

interface TestResultsProps {
  results: TestCaseResult[];
  isRunning?: boolean;
}

export function TestResults({ results, isRunning }: TestResultsProps) {
  if (isRunning) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Running test cases...</span>
      </div>
    );
  }

  if (results.length === 0) return null;

  const passed = results.filter(r => r.passed).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Test Results ({passed}/{results.length})
        </span>
        <span className={cn(
          'text-xs font-mono',
          passed === results.length ? 'text-emerald-400' : 'text-destructive',
        )}>
          {passed === results.length ? 'All Passed' : `${results.length - passed} Failed`}
        </span>
      </div>
      {results.map((result, i) => (
        <div
          key={i}
          className={cn(
            'rounded-lg border p-3 text-xs font-mono space-y-1',
            result.passed
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-destructive/5 border-destructive/20',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              {result.passed
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                : result.error
                  ? <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  : <XCircle className="w-3.5 h-3.5 text-destructive" />
              }
              Test Case {i + 1}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {result.executionTimeMs}ms &middot; {result.memoryUsedKb}KB
            </span>
          </div>
          {!result.passed && (
            <div className="space-y-1 pt-1">
              {result.error ? (
                <div className="text-destructive">Error: {result.error}</div>
              ) : (
                <>
                  <div>Expected: <span className="text-emerald-400">{result.expectedOutput}</span></div>
                  <div>Actual: <span className="text-destructive">{result.actualOutput || '(empty)'}</span></div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
