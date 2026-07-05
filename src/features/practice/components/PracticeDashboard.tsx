'use client';

import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { StatsDashboard } from '@/components/practice/StatsDashboard';
import { TopicMasteryGrid } from '@/components/practice/TopicMasteryGrid';
import { cn } from '@/lib/utils';
import type { PracticeProblemDocument } from '@/types';

interface TopicMasteryEntry {
  topic: string;
  solved: number;
  total: number;
}

interface PracticeDashboardProps {
  totalSolved: number;
  totalProblems: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  currentStreak: number;
  totalXp: number;
  accuracy: number;
  topicMastery: TopicMasteryEntry[];
  recommendations: PracticeProblemDocument[];
  loading: boolean;
  onStartProblem: (p: PracticeProblemDocument | null) => void;
  onTopicClick: (topic: string) => void;
}

export function PracticeDashboard({
  totalSolved, totalProblems, easySolved, mediumSolved, hardSolved,
  currentStreak, totalXp, accuracy, topicMastery, recommendations,
  loading, onStartProblem, onTopicClick,
}: PracticeDashboardProps) {
  return (
    <>
      <StatsDashboard
        totalSolved={totalSolved}
        totalProblems={totalProblems}
        easySolved={easySolved}
        mediumSolved={mediumSolved}
        hardSolved={hardSolved}
        currentStreak={currentStreak}
        totalXp={totalXp}
        accuracy={accuracy}
        loading={loading}
      />

      {recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Recommended for You</span>
            <span className="text-xs text-muted-foreground">Based on weak topics</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {recommendations.map((p) => {
              const diffColor = p.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                : p.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
                : 'text-destructive border-destructive/20 bg-destructive/10';
              const topics = (p.topics || []).slice(0, 2);

              return (
                <Card
                  key={p.id}
                  className="border-border hover:border-primary/30 transition-colors cursor-pointer h-full"
                  onClick={() => onStartProblem(p)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium truncate text-foreground flex-1 min-w-0">
                          {p.title}
                        </p>
                        <Badge variant="outline" className={cn('text-xs px-1.5 py-0.5 shrink-0', diffColor)}>
                          {p.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">+{p.points} XP</span>
                        {topics.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-auto truncate">
                            {topics.join(', ')}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full gap-1.5 h-7 hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); onStartProblem(p); }}
                      >
                        <Play className="w-3 h-3" /> Solve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-muted-foreground">Topic Mastery</span>
        </div>
        <TopicMasteryGrid topics={topicMastery} loading={loading} onTopicClick={onTopicClick} />
      </div>
    </>
  );
}
