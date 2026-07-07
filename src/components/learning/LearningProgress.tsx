'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Lightbulb, Brain, CheckCircle2, Target, Clock, Bookmark, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LearningProgress as LearningProgressType } from '@/types/learning';

interface Props {
  progress: LearningProgressType;
}

const STATUS_MAP = {
  'not-started': { label: 'Not Started', color: 'text-muted-foreground', dot: 'bg-muted-foreground/30' },
  'reading': { label: 'Reading', color: 'text-blue-400', dot: 'bg-blue-500' },
  'hints-used': { label: 'Hinted', color: 'text-amber-400', dot: 'bg-amber-500' },
  'mentor-consulted': { label: 'Mentored', color: 'text-violet-400', dot: 'bg-violet-500' },
  'solved': { label: 'Solved', color: 'text-emerald-400', dot: 'bg-emerald-500' },
  'mastered': { label: 'Mastered', color: 'text-emerald-300', dot: 'bg-emerald-400' },
};

const METRICS = [
  { key: 'timeSpent', label: 'Time Spent', icon: Clock, format: (v: number) => `${Math.round(v / 60)}m` },
  { key: 'hintsRevealed', label: 'Hints Used', icon: Lightbulb, format: (v: number) => `${v}` },
  { key: 'mentorQuestions', label: 'Mentor Questions', icon: Brain, format: (v: number) => `${v}` },
  { key: 'confidenceRating', label: 'Confidence', icon: Target, format: (v: number) => `${v}%` },
  { key: 'notesCount', label: 'Notes', icon: Bookmark, format: (v: number) => `${v}` },
  { key: 'revisionsCompleted', label: 'Revisions', icon: BarChart3, format: (v: number) => `${v}` },
] as const;

export function LearningProgressCard({ progress }: Props) {
  const status = STATUS_MAP[progress.status];

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', status.color.replace('text', 'bg') + '/10')}>
            <CheckCircle2 className={cn('w-4 h-4', status.color)} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground">Learning Progress</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
              <span className={cn('text-[10px] font-medium', status.color)}>{status.label}</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
          {progress.problemId.slice(0, 8)}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {METRICS.map(m => {
          const value = progress[m.key as keyof typeof progress] as number;
          return (
            <div key={m.key} className="text-center p-2 rounded-lg bg-muted/10">
              <m.icon className="w-3 h-3 text-muted-foreground/60 mx-auto mb-0.5" />
              <p className="text-[11px] font-bold font-mono text-foreground">{m.format(value)}</p>
              <p className="text-[8px] text-muted-foreground/60 mt-0.5">{m.label}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
