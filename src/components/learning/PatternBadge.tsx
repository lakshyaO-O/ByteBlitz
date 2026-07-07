'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, ChevronDown, ChevronRight, TrendingUp, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { PatternMatch } from '@/types/learning';

interface Props {
  pattern: PatternMatch;
  loading?: boolean;
}

export function PatternBadge({ pattern, loading }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-muted/20 animate-pulse" />
          <div className="h-3 w-32 bg-muted/20 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/40">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/5 transition-colors"
      >
        <div className={cn(
          'p-2 rounded-lg transition-colors',
          pattern.confidence >= 80 ? 'bg-emerald-500/10' :
          pattern.confidence >= 50 ? 'bg-amber-500/10' : 'bg-muted/20',
        )}>
          <Brain className={cn(
            'w-4 h-4',
            pattern.confidence >= 80 ? 'text-emerald-400' :
            pattern.confidence >= 50 ? 'text-amber-400' : 'text-muted-foreground',
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold capitalize">{pattern.primary.replace(/-/g, ' ')}</span>
            <Badge variant="outline" className={cn(
              'text-[9px] px-1.5 py-0',
              pattern.confidence >= 80 ? 'border-emerald-500/30 text-emerald-400' :
              pattern.confidence >= 50 ? 'border-amber-500/30 text-amber-400' :
              'border-muted-foreground/30 text-muted-foreground',
            )}>
              {pattern.confidence}%
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{pattern.reasoning.slice(0, 80)}...</p>
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">{pattern.reasoning}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-medium text-foreground">Secondary Patterns</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {pattern.secondary.length > 0 ? pattern.secondary.map(s => (
                    <Badge key={s} variant="secondary" className="text-[9px] px-1.5 py-0">
                      {s.replace(/-/g, ' ')}
                    </Badge>
                  )) : (
                    <span className="text-[10px] text-muted-foreground/60">None detected</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-violet-400" />
                  <span className="text-[10px] font-medium text-foreground">Required Knowledge</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {pattern.requiredKnowledge.map(k => (
                    <Badge key={k} variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
