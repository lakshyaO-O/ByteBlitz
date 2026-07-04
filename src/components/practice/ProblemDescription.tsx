'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Zap, Bookmark, BookmarkCheck, Lightbulb, FileText, MessageCircle, PenLine,
  CheckCircle2, Copy, Check, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { HintsPanel } from './HintsPanel';
import { EditorialPanel } from './EditorialPanel';
import { DiscussionPanel } from './DiscussionPanel';
import { NotesPanel } from './NotesPanel';
import type { PracticeProblemDocument, CodingLanguage } from '@/types';

interface ProblemDescriptionProps {
  problem: PracticeProblemDocument;
  userId: string | null;
  username: string;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  notes?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="absolute top-2 right-2 p-1 rounded text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-colors opacity-0 group-hover:opacity-100"
      aria-label="Copy code"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="group relative">
      {label && (
        <div className="text-xs font-medium text-muted-foreground/50 px-3 pt-2 pb-0">
          {label}
        </div>
      )}
      <pre className="text-sm font-mono leading-relaxed bg-background/60 p-3 rounded border border-border/50 overflow-x-auto">
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  );
}

function ExampleCard({
  example,
  index,
}: {
  example: { input: string; output: string; explanation?: string };
  index: number;
}) {
  return (
    <Card className="bg-muted/20 border-border/60 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30 bg-muted/10">
        <span className="text-xs font-medium text-primary font-mono">#{index + 1}</span>
        <span className="text-xs font-medium text-muted-foreground">Example {index + 1}</span>
      </div>
      <CardContent className="p-3 space-y-3">
        <div>
          <span className="text-xs font-medium text-muted-foreground mb-1 block">Input</span>
          <CodeBlock code={example.input} />
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground mb-1 block">Output</span>
          <CodeBlock code={example.output} />
        </div>
        {example.explanation && (
          <div>
            <span className="text-xs font-medium text-muted-foreground mb-1 block">Explanation</span>
            <p className="text-sm text-muted-foreground leading-relaxed bg-background/30 p-2.5 rounded border border-border/30">
              {example.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AcceptanceBar({ rate, totalSubmissions, totalAccepted }: { rate?: number; totalSubmissions?: number; totalAccepted?: number }) {
  if (rate === undefined) return null;
  const barColor = rate >= 70 ? 'bg-emerald-500' : rate >= 40 ? 'bg-yellow-500' : 'bg-destructive';

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded bg-muted/15 border border-border/40">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span className="text-sm font-medium tabular-nums">{rate}%</span>
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[80px]">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${rate}%` }} />
      </div>
      {totalSubmissions !== undefined && (
        <span className="text-xs text-muted-foreground shrink-0">
          {totalAccepted?.toLocaleString() ?? '—'}/{totalSubmissions.toLocaleString()}
        </span>
      )}
    </div>
  );
}

export function ProblemDescription({
  problem, userId, username, bookmarked, onToggleBookmark, notes,
}: ProblemDescriptionProps) {
  const diffConfig = problem.difficulty === 'Easy'
    ? { color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' }
    : problem.difficulty === 'Medium'
    ? { color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' }
    : { color: 'text-destructive', border: 'border-destructive/20', bg: 'bg-destructive/10', dot: 'bg-destructive' };

  const sampleTestCases = (problem.testCases || []).filter(tc => !tc.isHidden).slice(0, 3);
  const examples = (problem.examples?.length ? problem.examples : sampleTestCases.map(tc => ({
    input: tc.input,
    output: tc.expected,
    explanation: undefined,
  }))).slice(0, 3);

  const acRate = problem.acceptanceRate ?? (problem.totalSubmissions && problem.totalSubmissions > 0
    ? Math.round(((problem.totalAccepted ?? 0) / problem.totalSubmissions) * 100) : undefined);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60">
        <div className="p-4 pb-3 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground leading-tight">{problem.title}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
                  diffConfig.bg, diffConfig.color, diffConfig.border,
                )}>
                  <span className={cn('w-1 h-1 rounded-full', diffConfig.dot)} />
                  {problem.difficulty}
                </span>
                {problem.category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted/30 text-muted-foreground border border-border/40">
                    {problem.category}
                  </span>
                )}
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" /> {problem.points} XP
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0" onClick={onToggleBookmark}>
              {bookmarked
                ? <BookmarkCheck className="w-4 h-4 text-primary" />
                : <Bookmark className="w-4 h-4 text-muted-foreground" />
              }
            </Button>
          </div>

          {problem.topics && problem.topics.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {problem.topics.map((topic) => (
                <Badge key={topic} variant="outline" className="text-xs bg-muted/20 border-border/40">{topic}</Badge>
              ))}
            </div>
          )}

          {acRate !== undefined && (
            <AcceptanceBar rate={acRate} totalSubmissions={problem.totalSubmissions} totalAccepted={problem.totalAccepted} />
          )}
        </div>
      </div>

      <Tabs defaultValue="description" className="flex-1 flex flex-col min-h-0">
        <TabsList className="px-4 bg-muted/10 border-b border-border/50 h-9 justify-start gap-0 rounded-none">
          {[
            { value: 'description', label: 'Description', icon: FileText },
            { value: 'hints', label: 'Hints', icon: Lightbulb, count: problem.hints?.length },
            { value: 'editorial', label: 'Editorial', icon: FileText },
            { value: 'discussion', label: 'Discussion', icon: MessageCircle },
            { value: 'notes', label: 'Notes', icon: PenLine },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-none',
                'data-[state=active]:text-foreground data-[state=active]:shadow-none',
                'data-[state=active]:border-b-2 data-[state=active]:border-primary',
                'text-muted-foreground hover:text-foreground/80 transition-colors',
              )}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-xs text-muted-foreground">({tab.count})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4 pb-8">
            <TabsContent value="description" className="mt-0 space-y-5">
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {problem.description}
              </div>

              {problem.constraints && problem.constraints.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-foreground/70">Constraints</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {problem.constraints.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded text-xs font-mono font-medium bg-muted/20 border border-border/40 text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {examples.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-foreground/70">Examples</h3>
                  <div className="space-y-3">
                    {examples.map((ex, i) => (
                      <ExampleCard key={i} example={ex} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {(problem as any).relatedProblems?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-foreground/70">Related Problems</h3>
                  <div className="space-y-1">
                    {(problem as any).relatedProblems.map((rp: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded bg-muted/10 border border-border/30 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                        {rp}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="hints" className="mt-0">
              <HintsPanel hints={problem.hints || []} />
            </TabsContent>

            <TabsContent value="editorial" className="mt-0">
              <EditorialPanel editorial={problem.editorial || ''} solutionCode={problem.solutionCode || {} as Record<CodingLanguage, string>} />
            </TabsContent>

            <TabsContent value="discussion" className="mt-0">
              <DiscussionPanel problemId={problem.id} userId={userId} username={username} />
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
              <NotesPanel userId={userId} problemId={problem.id} initialNotes={notes} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
