'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Play, RotateCcw, CheckCircle2, XCircle, Loader2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodePlaygroundProps {
  starterCode: string;
  expectedOutput?: string;
  testCases?: Array<{ input: string; expected: string }>;
  solution?: string;
  hint?: string;
  onRun?: (output: string) => void;
  onSuccess?: () => void;
  height?: string;
  showRunButton?: boolean;
  language?: string;
}

function runJavaScript(code: string, input: string = ''): string {
  const logs: string[] = [];
  const print = (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));

  try {
    const fn = new Function('console', 'input', 'print', code);
    fn({ log: print }, input, print);
    return logs.join('\n');
  } catch (err: any) {
    return `Error: ${err.message || 'Runtime error'}`;
  }
}

export function CodePlayground({
  starterCode,
  expectedOutput,
  testCases,
  solution,
  hint,
  onRun,
  onSuccess,
  height = '300px',
  showRunButton = true,
  language = 'javascript',
}: CodePlaygroundProps) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ passed: boolean; input: string; expected: string; actual: string }> | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  useEffect(() => {
    setCode(starterCode);
    setOutput(null);
    setTestResults(null);
    setShowHint(false);
    setShowSolution(false);
    setAllPassed(false);
  }, [starterCode]);

  const handleRun = () => {
    setIsRunning(true);
    setOutput(null);
    setTestResults(null);
    setAllPassed(false);

    setTimeout(() => {
      const result = runJavaScript(code);

      if (testCases && testCases.length > 0) {
        const results = testCases.map(tc => ({
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: '',
        }));

        const fullResult = runJavaScript(code, '');
        const lines = fullResult.split('\n').filter(l => l);

        let passedCount = 0;
        for (let i = 0; i < Math.min(results.length, lines.length); i++) {
          const actual = lines[i].trim();
          results[i].actual = actual;
          results[i].passed = actual === results[i].expected.trim();
          if (results[i].passed) passedCount++;
        }

        setTestResults(results);
        setOutput(fullResult);

        if (passedCount === results.length && results.length > 0) {
          setAllPassed(true);
          onSuccess?.();
        }
      } else {
        setOutput(result);
        if (expectedOutput && result.trim() === expectedOutput.trim()) {
          setAllPassed(true);
          onSuccess?.();
        }
      }

      onRun?.(result);
      setIsRunning(false);
    }, 300);
  };

  const handleReset = () => {
    setCode(starterCode);
    setOutput(null);
    setTestResults(null);
    setShowHint(false);
    setShowSolution(false);
    setAllPassed(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) setCode(value);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 overflow-hidden bg-card/30">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground ml-2">playground.js</span>
        </div>
        <div className="flex items-center gap-2">
          {hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" /> Hint
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground hover:bg-muted/20 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          {showRunButton && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run
            </button>
          )}
        </div>
      </div>

      <div style={{ height }} className="w-full">
        <MonacoEditor
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            automaticLayout: true,
          }}
        />
      </div>

      {showHint && hint && (
        <div className="mx-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-200">
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-400 mb-1">Hint</p>
          {hint}
        </div>
      )}

      {testResults && (
        <div className="px-4 pb-3 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Test Results</p>
          {testResults.map((tr, i) => (
            <div key={i} className={cn(
              'flex items-center gap-2 p-2.5 rounded-lg text-sm border',
              tr.passed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20'
            )}>
              {tr.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                {tr.input && <p className="text-[11px] text-muted-foreground">Input: {tr.input}</p>}
                <p className="text-[11px] text-muted-foreground">Expected: {tr.expected}</p>
                <p className={cn('text-[11px]', tr.passed ? 'text-emerald-400' : 'text-destructive')}>
                  Got: {tr.actual || '(empty)'}
                </p>
              </div>
            </div>
          ))}
          {allPassed && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">All tests passed!</span>
            </div>
          )}
        </div>
      )}

      {output !== null && !testResults && (
        <div className="px-4 pb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Output</p>
          <pre className="p-3 rounded-xl bg-black/40 border border-border/40 text-sm font-mono text-cyan-200 whitespace-pre-wrap overflow-x-auto max-h-32">
            {output || '(no output)'}
          </pre>
          {expectedOutput && (
            <div className={cn(
              'mt-2 flex items-center gap-2 text-sm',
              output.trim() === expectedOutput.trim() ? 'text-emerald-400' : 'text-destructive'
            )}>
              {output.trim() === expectedOutput.trim() ? (
                <><CheckCircle2 className="w-4 h-4" /> Correct!</>
              ) : (
                <><XCircle className="w-4 h-4" /> Expected: {expectedOutput}</>
              )}
            </div>
          )}
        </div>
      )}

      {solution && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSolution ? 'Hide' : 'Show'} Solution
          </button>
          {showSolution && (
            <pre className="mt-2 p-3 rounded-xl bg-muted/30 border border-border/40 text-sm font-mono text-muted-foreground whitespace-pre-wrap overflow-x-auto">
              {solution}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
