'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play, Send, RotateCcw, ArrowLeft, Loader2, BookOpen, ChevronLeft, ChevronRight,
  Share2, GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TestResults } from './TestResults';
import { SubmissionResult } from './SubmissionResult';
import { ProblemDescription } from './ProblemDescription';
import { ShortcutHint } from './ShortcutHint';
import { usePracticeSession } from '@/hooks/use-practice-session';
import { useUserProgress } from '@/hooks/use-practice-problems';
import { toggleBookmark } from '@/services/practice';
import { useAppStore } from '@/store/app-store';
import type { PracticeProblemDocument, CodingLanguage } from '@/types';

interface PracticeWorkbenchProps {
  problem: PracticeProblemDocument;
  onBack: () => void;
  userId: string | null;
  username: string;
  onPrevProblem?: (() => void) | null;
  onNextProblem?: (() => void) | null;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function PracticeWorkbench({
  problem, onBack, userId, username,
  onPrevProblem, onNextProblem, hasPrev, hasNext,
}: PracticeWorkbenchProps) {
  const [showDescription, setShowDescription] = useState(true);
  const [activeTab, setActiveTab] = useState<'output' | 'results' | 'submission'>('output');
  const [descWidth, setDescWidth] = useState(380);
  const isDragging = useRef(false);

  const { progress } = useUserProgress(userId);
  const userProgress = progress[problem.id];

  const session = usePracticeSession(userId, username, problem);

  useEffect(() => {
    if (session.testResults.length > 0) setActiveTab('results');
  }, [session.testResults]);

  useEffect(() => {
    if (session.verdict) setActiveTab('submission');
  }, [session.verdict]);

  const { recordSubmission, recordPracticeSolved } = useAppStore();

  useEffect(() => {
    if (session.verdict) {
      recordSubmission(session.verdict === 'Accepted');
      if (session.verdict === 'Accepted' && session.passedTestCases === session.totalTestCases) {
        recordPracticeSolved();
      }
    }
  }, [session.verdict, session.passedTestCases, session.totalTestCases]);

  const runTestsRef = useRef(session.runTests);
  const submitRef = useRef(session.submit);
  runTestsRef.current = session.runTests;
  submitRef.current = session.submit;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) submitRef.current();
        else runTestsRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleBookmark = async () => {
    if (!userId) return;
    await toggleBookmark(userId, problem.id, !!userProgress?.bookmarked);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/practice?problem=${problem.id}`;
    if (navigator.share) {
      await navigator.share({ title: problem.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.max(200, Math.min(600, e.clientX));
      setDescWidth(newWidth);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const difficultyColor = problem.difficulty === 'Easy' ? 'text-emerald-400' :
    problem.difficulty === 'Medium' ? 'text-yellow-400' : 'text-destructive';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-0 -m-6 lg:-m-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 shrink-0">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="h-4 w-px bg-border shrink-0" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={!hasPrev} onClick={() => onPrevProblem?.()} className="h-7 w-7 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled={!hasNext} onClick={() => onNextProblem?.()} className="h-7 w-7 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="h-4 w-px bg-border shrink-0" />
          <h2 className="font-bold text-sm truncate max-w-[120px] lg:max-w-[250px]">{problem.title}</h2>
          <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-widest shrink-0', difficultyColor)}>
            {problem.difficulty}
          </Badge>
          {userProgress?.solved && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">Solved</Badge>
          )}
        </div>
        <div className="flex items-center gap-1 lg:gap-2">
          <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1 text-xs h-7">
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Share</span>
          </Button>
          <ShortcutHint />
          <Button variant="ghost" size="sm" onClick={() => setShowDescription(!showDescription)} className="gap-1 text-xs h-7">
            <BookOpen className="w-3.5 h-3.5" />
            {showDescription ? 'Hide' : 'Problem'}
          </Button>
          <Button variant="outline" size="sm" onClick={session.resetCode} className="gap-1 text-xs h-7">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Desktop: Side-by-side */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className={cn(
          'flex flex-col border-r border-border transition-[width] duration-100 relative',
          showDescription ? '' : 'w-0 min-w-0 overflow-hidden',
        )}
          style={showDescription ? { width: descWidth, minWidth: 260 } : undefined}
        >
          <ProblemDescription
            problem={problem}
            userId={userId}
            username={username}
            bookmarked={!!userProgress?.bookmarked}
            onToggleBookmark={handleToggleBookmark}
            notes={userProgress?.notes}
          />
          {showDescription && (
            <div
              className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
              onMouseDown={handleMouseDown}
            >
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 text-muted-foreground">
                <GripVertical className="w-3 h-3" />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <Toolbar session={session} problem={problem} />
          <div className="flex-1 min-h-0">
            <CodeEditor
              initialCode={session.code}
              language={session.language}
              problemId={problem.id}
              problemTitle={problem.title}
              userId={userId}
              onChange={session.setCode}
              height="100%"
            />
          </div>
          <ConsolePanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            session={session}
            timeLimitMs={problem.timeLimitMs}
            memoryLimitKb={problem.memoryLimitKb}
          />
        </div>
      </div>

      {/* Mobile: Stacked */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto border-b border-border">
          {showDescription ? (
            <ProblemDescription
              problem={problem}
              userId={userId}
              username={username}
              bookmarked={!!userProgress?.bookmarked}
              onToggleBookmark={handleToggleBookmark}
              notes={userProgress?.notes}
            />
          ) : (
            <>
              <div className="flex-1 min-h-[300px]">
                <CodeEditor
                  initialCode={session.code}
                  language={session.language}
                  problemId={problem.id}
                  problemTitle={problem.title}
                  userId={userId}
                  onChange={session.setCode}
                  height="300px"
                />
              </div>
              <ConsolePanel
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                session={session}
                timeLimitMs={problem.timeLimitMs}
                memoryLimitKb={problem.memoryLimitKb}
              />
            </>
          )}
        </div>
        <div className="shrink-0 border-t border-border bg-card/30 p-2">
          <Toolbar session={session} problem={problem} />
        </div>
      </div>
    </div>
  );
}

function Toolbar({ session, problem }: { session: ReturnType<typeof usePracticeSession>; problem: PracticeProblemDocument }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b border-border">
      <div className="flex items-center gap-2">
        <select
          value={session.language}
          onChange={(e) => session.setLanguage(e.target.value as CodingLanguage)}
          className="bg-background border border-border rounded px-2 py-0.5 text-xs font-mono"
        >
          {Object.keys(problem.starterCode || {}).map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        {false && (
          <span className="text-[10px] text-yellow-400 font-bold">Unsaved</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={session.runTests}
          disabled={session.isRunning || session.isSubmitting}
          className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700"
        >
          {session.isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          Run
          <span className="hidden md:inline text-[10px] text-emerald-200">(Ctrl+Enter)</span>
        </Button>
        <Button
          size="sm"
          onClick={session.submit}
          disabled={session.isRunning || session.isSubmitting}
          className="gap-1.5 text-xs h-8"
        >
          {session.isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Submit
          <span className="hidden md:inline text-[10px] text-primary-foreground/70">(Ctrl+Shift+Enter)</span>
        </Button>
      </div>
    </div>
  );
}

function ConsolePanel({
  activeTab, setActiveTab, session, timeLimitMs, memoryLimitKb,
}: {
  activeTab: 'output' | 'results' | 'submission';
  setActiveTab: (t: 'output' | 'results' | 'submission') => void;
  session: ReturnType<typeof usePracticeSession>;
  timeLimitMs?: number;
  memoryLimitKb?: number;
}) {
  return (
    <div className="h-[220px] border-t border-border bg-card/20 flex flex-col shrink-0">
      <div className="flex items-center border-b border-border bg-muted/20">
        {[
          { id: 'output' as const, label: 'Console' },
          { id: 'results' as const, label: 'Test Results', count: session.testResults.length },
          { id: 'submission' as const, label: 'Submission', active: !!session.verdict },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors',
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground',
              (tab.count ?? 0) === 0 && tab.id === 'results' && 'opacity-50',
              !tab.active && tab.id === 'submission' && 'opacity-50',
            )}
          >
            {tab.label}
            {(tab.count ?? 0) > 0 && <span className="ml-1.5 text-[9px]">({tab.count})</span>}
          </button>
        ))}
      </div>
      <ScrollArea className="flex-1 p-3">
        {activeTab === 'output' && (
          <div className="text-xs font-mono text-muted-foreground space-y-1">
            <p className="text-cyan-50/60">&gt; Ready. Click "Run" to test your code against sample cases, or "Submit" for full evaluation.</p>
            <p className="text-cyan-50/60">&gt; Use <kbd className="px-1 py-0.5 rounded bg-muted border border-border">Ctrl+Enter</kbd> to run, <kbd className="px-1 py-0.5 rounded bg-muted border border-border">Ctrl+Shift+Enter</kbd> to submit.</p>
            <p className="text-cyan-50/60">&gt; Code is auto-saved in your browser (IndexedDB).</p>
          </div>
        )}
        {activeTab === 'results' && (
          <TestResults results={session.testResults} isRunning={session.isRunning} />
        )}
        {activeTab === 'submission' && (
          <SubmissionResult
            verdict={session.verdict}
            passedTestCases={session.passedTestCases}
            totalTestCases={session.totalTestCases}
            executionTimeMs={session.executionTimeMs}
            memoryUsedKb={session.memoryUsedKb}
            status={session.isSubmitting ? 'running' : session.verdict ? 'completed' : 'pending'}
            testResults={session.testResults}
            problemTimeLimit={timeLimitMs}
            problemMemoryLimit={memoryLimitKb}
          />
        )}
      </ScrollArea>
    </div>
  );
}
