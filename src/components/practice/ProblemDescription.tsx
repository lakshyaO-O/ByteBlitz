'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Zap, Bookmark, BookmarkCheck } from 'lucide-react';
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

export function ProblemDescription({
  problem, userId, username, bookmarked, onToggleBookmark, notes,
}: ProblemDescriptionProps) {
  const difficultyColor = problem.difficulty === 'Easy' ? 'text-emerald-400' :
    problem.difficulty === 'Medium' ? 'text-yellow-400' : 'text-destructive';

  const sampleTestCases = (problem.testCases || []).filter(tc => !tc.isHidden).slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h2 className="font-bold text-lg truncate">{problem.title}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-widest', difficultyColor)}>
                {problem.difficulty}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">
                {problem.category}
              </Badge>
              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" /> {problem.points} pts
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0" onClick={onToggleBookmark}>
            {bookmarked
              ? <BookmarkCheck className="w-4 h-4 text-primary" />
              : <Bookmark className="w-4 h-4 text-muted-foreground" />
            }
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {problem.topics?.map((topic) => (
            <Badge key={topic} variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-muted/30">
              {topic}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="description" className="flex-1 flex flex-col min-h-0">
        <TabsList className="px-4 py-0 bg-muted/20 border-b border-border rounded-none h-9 justify-start gap-0">
          <TabsTrigger value="description" className="text-[10px] h-9 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Description</TabsTrigger>
          <TabsTrigger value="hints" className="text-[10px] h-9 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Hints</TabsTrigger>
          <TabsTrigger value="editorial" className="text-[10px] h-9 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Editorial</TabsTrigger>
          <TabsTrigger value="discussion" className="text-[10px] h-9 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Discussion</TabsTrigger>
          <TabsTrigger value="notes" className="text-[10px] h-9 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Notes</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="description" className="mt-0 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{problem.description}</p>

              {problem.constraints && problem.constraints.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Constraints</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {problem.constraints.map((c, i) => (
                      <li key={i} className="text-xs text-muted-foreground font-mono">{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {sampleTestCases.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Examples</h3>
                  {sampleTestCases.map((tc, i) => (
                    <Card key={i} className="bg-muted/20 border-border">
                      <CardContent className="p-3 space-y-1.5">
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground">Input:</span>
                          <pre className="mt-0.5 text-xs font-mono bg-background/50 p-1.5 rounded border border-border overflow-x-auto">{tc.input}</pre>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground">Expected Output:</span>
                          <pre className="mt-0.5 text-xs font-mono bg-background/50 p-1.5 rounded border border-border overflow-x-auto">{tc.expected}</pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
