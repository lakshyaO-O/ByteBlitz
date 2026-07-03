'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { StatsDashboard } from '@/components/practice/StatsDashboard';
import { TopicMasteryGrid } from '@/components/practice/TopicMasteryGrid';
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
        <Card className="bg-card/50 border-primary/20 border overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Recommended for You</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {recommendations.map(p => (
                <button
                  key={p.id}
                  onClick={() => onStartProblem(p)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-bold hover:border-primary/50 transition-colors whitespace-nowrap"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Topic Mastery</span>
        </div>
        <TopicMasteryGrid topics={topicMastery} loading={loading} onTopicClick={onTopicClick} />
      </div>
    </>
  );
}
