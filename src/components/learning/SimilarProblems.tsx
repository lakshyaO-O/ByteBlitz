'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { SimilarProblemGroup } from '@/types/learning';

interface Props {
  problems: SimilarProblemGroup;
}

function ProblemList({ items, label, icon: Icon, color }: {
  items: SimilarProblemGroup['easier'];
  label: string;
  icon: typeof ArrowUp;
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className={cn('w-3 h-3', color)} />
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="space-y-0.5">
        {items.map(p => (
          <Link key={p.id} href={`/practice?problem=${p.id}`}
            className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/10 transition-colors group"
          >
            <span className="text-[11px] text-foreground group-hover:text-primary transition-colors truncate">{p.title}</span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <Badge variant="outline" className={cn(
                'text-[8px] px-1.5 py-0',
                p.difficulty === 'Easy' && 'border-emerald-500/30 text-emerald-400',
                p.difficulty === 'Medium' && 'border-amber-500/30 text-amber-400',
                p.difficulty === 'Hard' && 'border-red-500/30 text-red-400',
              )}>{p.difficulty}</Badge>
              <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SimilarProblems({ problems }: Props) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-indigo-400" />
        <h4 className="text-xs font-semibold text-foreground">Practice Progression</h4>
      </div>

      <div className="space-y-3 divide-y divide-border/20">
        <div className="pb-2">
          <ProblemList items={problems.easier} label="Easier — Build Confidence" icon={ArrowDown} color="text-emerald-400" />
        </div>
        <div className="py-2">
          <ProblemList items={problems.similar} label="Similar — Reinforce" icon={Layers} color="text-amber-400" />
        </div>
        <div className="pt-2">
          <ProblemList items={problems.harder} label="Harder — Level Up" icon={ArrowUp} color="text-red-400" />
        </div>
      </div>
    </Card>
  );
}
