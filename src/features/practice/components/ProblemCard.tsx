'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle2, Code2, BookmarkCheck, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PracticeProblemDocument } from '@/types';

const difficultyColors: Record<string, string> = {
  Easy: 'text-emerald-400',
  Medium: 'text-yellow-400',
  Hard: 'text-destructive',
};
const difficultyBg: Record<string, string> = {
  Easy: 'bg-emerald-500/10',
  Medium: 'bg-yellow-500/10',
  Hard: 'bg-destructive/10',
};

interface ProblemCardProps {
  problem: PracticeProblemDocument;
  solved: boolean;
  bookmarked: boolean;
  locked: boolean;
  onSelect: () => void;
}

export function ProblemCard({ problem, solved, bookmarked, locked, onSelect }: ProblemCardProps) {
  const difficultyColor = difficultyColors[problem.difficulty] || 'text-muted-foreground';
  const diffBg = difficultyBg[problem.difficulty] || 'bg-muted';

  return (
    <div
      onClick={locked ? undefined : onSelect}
      className={cn('cursor-pointer transition-opacity', locked && 'opacity-40 cursor-not-allowed')}
    >
      <Card className="border-border hover:border-primary/50 transition-colors group">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                solved ? 'bg-emerald-500/10' : diffBg,
              )}>
                {locked ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : solved ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Code2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {problem.title}
                  </h3>
                  {bookmarked && <BookmarkCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={cn('text-xs font-medium', difficultyColor)}>
                    {problem.difficulty}
                  </span>
                  {problem.category && (
                    <Badge variant="outline" className="text-xs bg-muted/30">
                      {problem.category}
                    </Badge>
                  )}
                  <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {problem.points}
                  </span>
                  {problem.topics?.slice(0, 2).map(topic => (
                    <Badge key={topic} variant="secondary" className="text-xs hidden sm:inline-flex">
                      {topic}
                    </Badge>
                  ))}
                  {problem.estimatedTime && (
                    <span className="text-xs text-muted-foreground hidden lg:inline">
                      ~{problem.estimatedTime}m
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!locked && (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-3" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
