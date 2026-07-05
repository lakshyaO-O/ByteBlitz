'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  BookOpen, Code2, Layers, Braces, FunctionSquare, RefreshCw,
  ArrowUpDown, Search, Hash, Wind, ListOrdered, Link2,
  GitBranch, Share2, BarChart3, Hand, Binary, Terminal, MoveHorizontal,
  Maximize2, Sigma, Type, GitFork, Sliders, Grid3X3,
} from 'lucide-react';

const TOPIC_ICONS: Record<string, any> = {
  Arrays: Grid3X3,
  Strings: Type,
  Math: Sigma,
  Loops: RefreshCw,
  Functions: FunctionSquare,
  Recursion: RefreshCw,
  Sorting: ArrowUpDown,
  Searching: Search,
  Hashing: Hash,
  Stack: Wind,
  Queue: ListOrdered,
  'Linked List': Link2,
  Trees: GitBranch,
  Graphs: Share2,
  Heap: BarChart3,
  Greedy: Hand,
  'Dynamic Programming': Binary,
  Backtracking: Terminal,
  'Bit Manipulation': Sliders,
  'Binary Search': Search,
  'Two Pointers': MoveHorizontal,
  'Sliding Window': Maximize2,
  'Prefix Sum': Sigma,
  Tries: Type,
  'Union Find': GitFork,
  'Segment Tree': GitBranch,
  SQL: BookOpen,
};

interface TopicMastery {
  topic: string;
  solved: number;
  total: number;
}

interface TopicMasteryGridProps {
  topics: TopicMastery[];
  loading?: boolean;
  onTopicClick?: (topic: string) => void;
}

export function TopicMasteryGrid({ topics, loading, onTopicClick }: TopicMasteryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="border-border animate-pulse">
            <CardContent className="p-3 space-y-2">
              <div className="h-3 w-20 bg-muted/50 rounded" />
              <div className="h-4 w-12 bg-muted/50 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (topics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {topics.map((topic) => {
        const Icon = TOPIC_ICONS[topic.topic] || Code2;
        const pct = topic.total > 0 ? Math.round((topic.solved / topic.total) * 100) : 0;
        const color =
          pct >= 80 ? 'text-emerald-400' :
          pct >= 50 ? 'text-yellow-400' :
          pct >= 20 ? 'text-orange-400' :
          'text-muted-foreground';
        const bgColor =
          pct >= 80 ? 'bg-emerald-500/10' :
          pct >= 50 ? 'bg-yellow-500/10' :
          pct >= 20 ? 'bg-orange-500/10' :
          'bg-muted/20';

        return (
          <button
            key={topic.topic}
            onClick={() => onTopicClick?.(topic.topic)}
            className="text-left"
          >
            <Card className="border-border hover:border-primary/30 transition-colors cursor-pointer h-full">
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className={cn('w-6 h-6 rounded flex items-center justify-center shrink-0', bgColor)}>
                    <Icon className={cn('w-3 h-3', color)} />
                  </div>
                  <span className="text-xs font-medium truncate text-muted-foreground">
                    {topic.topic}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn('text-sm font-semibold', color)}>
                    {topic.solved}/{topic.total}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', color.replace('text', 'bg'))}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
