'use client';

import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Search, ChevronRight, Code2, BarChart3, Zap, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { CONCEPTS } from '@/data/concepts';

const CATEGORIES = ['all', 'searching', 'technique', 'graph', 'optimization', 'data-structure'];

export function ConceptsIndex() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const entries = Object.values(CONCEPTS).filter(c => {
    if (category !== 'all' && c.category !== category) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
        !c.definition.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-primary" />
            Concept Encyclopedia
          </h1>
          <p className="text-sm text-muted-foreground">
            Every algorithm explained — definition, complexity, when to use, and code examples.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search concepts..."
              className="pl-8 h-9 text-xs"
            />
          </div>
          <div className="flex gap-1">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                  category === c
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/10',
                )}
              >
                {c === 'all' ? 'All' : c.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {entries.map(entry => (
            <Link key={entry.slug} href={`/learn/concepts/${entry.slug}`}>
              <Card className="p-4 h-full border-border/40 hover:border-primary/30 hover:bg-muted/10 transition-all group">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {entry.title}
                    </h3>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors shrink-0 mt-0.5" />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{entry.definition}</p>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" />
                      {entry.complexity.timeWorst}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <HardDrive className="w-2.5 h-2.5" />
                      {entry.complexity.spaceWorst}
                    </span>
                    <Badge variant="secondary" className="text-[8px] px-1 py-0">
                      {entry.category}
                    </Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No concepts found matching your search.</p>
          </div>
        )}
      </div>
    </Shell>
  );
}
