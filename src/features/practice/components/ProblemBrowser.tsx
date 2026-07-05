'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, BookmarkCheck, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ProblemCard } from './ProblemCard';
import { ProblemFilters } from './ProblemFilters';
import type { PracticeProblemDocument, Difficulty, ProblemTopic } from '@/types';

const PAGE_SIZE = 20;

interface ProblemBrowserProps {
  problems: PracticeProblemDocument[];
  progress: Record<string, { solved: boolean; bookmarked: boolean }>;
  isBeginner: boolean;
  unlockedDifficulties: Difficulty[];
  canAccess: (d: Difficulty) => boolean;
  onStartProblem: (p: PracticeProblemDocument) => void;
  onResetFilters?: () => void;
}

export function ProblemBrowser({
  problems, progress, isBeginner, unlockedDifficulties, canAccess,
  onStartProblem, onResetFilters,
}: ProblemBrowserProps) {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [topic, setTopic] = useState<string>('All');
  const [tab, setTab] = useState('all');
  const [sortBy, setSortBy] = useState<string>('Default');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  const filteredProblems = useMemo(() => {
    let filtered = problems;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.topics?.some(t => t.toLowerCase().includes(q)) ||
        p.category?.toLowerCase().includes(q),
      );
    }

    if (difficulty !== 'All') {
      filtered = filtered.filter(p => p.difficulty === difficulty);
    }

    if (topic !== 'All') {
      filtered = filtered.filter(p =>
        p.topics?.includes(topic as ProblemTopic) || p.category === topic,
      );
    }

    if (isBeginner && difficulty === 'All') {
      filtered = filtered.filter(p => canAccess(p.difficulty));
    }

    filtered = filtered.filter(p => {
      const isSolved = !!progress[p.id]?.solved;
      switch (tab) {
        case 'solved': return isSolved;
        case 'unsolved': return !isSolved;
        case 'bookmarked': return !!progress[p.id]?.bookmarked;
        default: return true;
      }
    });

    switch (sortBy) {
      case 'XP (Low)': filtered.sort((a, b) => a.points - b.points); break;
      case 'XP (High)': filtered.sort((a, b) => b.points - a.points); break;
      case 'Acceptance': filtered.sort((a, b) => (b.acceptanceRate || 0) - (a.acceptanceRate || 0)); break;
      case 'Difficulty': {
        const order = { Easy: 0, Medium: 1, Hard: 2 };
        filtered.sort((a, b) => (order[a.difficulty] || 0) - (order[b.difficulty] || 0));
        break;
      }
    }

    return filtered;
  }, [problems, search, difficulty, topic, tab, sortBy, progress, isBeginner, canAccess]);

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedProblems = filteredProblems.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const handleResetFilters = () => {
    setSearch('');
    setDifficulty('All');
    setTopic('All');
    setTab('all');
    setSortBy('Default');
    setPage(0);
    onResetFilters?.();
  };

  const activeFilterCount = [difficulty !== 'All', topic !== 'All', sortBy !== 'Default', !!search].filter(Boolean).length;

  return (
    <Tabs defaultValue="all" className="space-y-4" onValueChange={(v) => { setTab(v); setPage(0); }}>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unsolved">Unsolved</TabsTrigger>
          <TabsTrigger value="solved">Solved</TabsTrigger>
          <TabsTrigger value="bookmarked">
            <BookmarkCheck className="w-3 h-3 mr-1" />
            Saved
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
            <Input
              placeholder="Search problems..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(0); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters || activeFilterCount > 0 ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5 h-8"
          >
            Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
        </div>
      </div>

      {showFilters && (
        <ProblemFilters
          difficulty={difficulty}
          topic={topic}
          sortBy={sortBy}
          isBeginner={isBeginner}
          unlockedDifficulties={unlockedDifficulties}
          onDifficultyChange={(d) => { setDifficulty(d); setPage(0); }}
          onTopicChange={(t) => { setTopic(t); setPage(0); }}
          onSortChange={(s) => { setSortBy(s); setPage(0); }}
          onClearTopic={() => { setTopic('All'); setPage(0); }}
        />
      )}

      <TabsContent value={tab} className="mt-0 space-y-2">
        {filteredProblems.length > 0 ? (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-muted-foreground">
                {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''}
              </span>
              {search && (
                <span className="text-xs text-muted-foreground">
                  Searching: &ldquo;{search}&rdquo;
                </span>
              )}
            </div>
            {pagedProblems.map((problem: PracticeProblemDocument) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                solved={!!progress[problem.id]?.solved}
                bookmarked={!!progress[problem.id]?.bookmarked}
                locked={isBeginner && !canAccess(problem.difficulty)}
                onSelect={() => onStartProblem(problem)}
              />
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="h-7"
                >
                  <ChevronLeft className="w-3 h-3 mr-1" /> Prev
                </Button>
                <span className="text-xs font-mono text-muted-foreground">
                  Page {safePage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="h-7"
                >
                  Next <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <p className="font-medium text-muted-foreground">No matching problems</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Try a different search query.' : 'Try adjusting your filters.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5"
              onClick={handleResetFilters}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
