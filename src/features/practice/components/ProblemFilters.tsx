'use client';

import { Button } from '@/components/ui/button';
import { Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Difficulty } from '@/types';

export const ALL_TOPICS = [
  'Arrays', 'Strings', 'Math', 'Loops', 'Functions', 'Recursion',
  'Sorting', 'Searching', 'Hashing', 'Stack', 'Queue', 'Linked List',
  'Trees', 'Graphs', 'Heap', 'Greedy', 'Dynamic Programming',
  'Backtracking', 'Bit Manipulation', 'Binary Search', 'Two Pointers',
  'Sliding Window', 'Prefix Sum', 'Tries', 'Union Find', 'Segment Tree', 'SQL',
];

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const SORT_OPTIONS = ['Default', 'XP (Low)', 'XP (High)', 'Acceptance', 'Difficulty'] as const;

interface ProblemFiltersProps {
  difficulty: string;
  topic: string;
  sortBy: string;
  isBeginner: boolean;
  unlockedDifficulties: Difficulty[];
  onDifficultyChange: (d: string) => void;
  onTopicChange: (t: string) => void;
  onSortChange: (s: string) => void;
  onClearTopic: () => void;
}

export function ProblemFilters({
  difficulty, topic, sortBy, isBeginner, unlockedDifficulties,
  onDifficultyChange, onTopicChange, onSortChange, onClearTopic,
}: ProblemFiltersProps) {
  return (
    <div className="space-y-3 p-4 rounded-lg bg-muted/10 border border-border">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground w-16">Difficulty</span>
        {DIFFICULTIES.map((d) => {
          const locked = isBeginner && d !== 'All' && d !== 'Easy' && !unlockedDifficulties.includes(d as Difficulty);
          return (
            <Button
              key={d}
              variant={difficulty === d ? 'default' : 'outline'}
              size="sm"
              disabled={locked}
              onClick={() => onDifficultyChange(d)}
              className="text-xs h-7"
            >
              {locked && <Lock className="w-3 h-3 mr-1" />}
              {d}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground w-16">Topic</span>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {ALL_TOPICS.map(t => (
            <button
              key={t}
              onClick={() => onTopicChange(topic === t ? 'All' : t)}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium transition-colors whitespace-nowrap',
                topic === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground border border-border',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {topic !== 'All' && (
          <Button variant="ghost" size="sm" onClick={onClearTopic} className="text-xs h-6">
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground w-16">Sort</span>
        {SORT_OPTIONS.map(s => (
          <Button
            key={s}
            variant={sortBy === s ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onSortChange(s)}
            className="text-xs h-7"
          >
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}
