'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Lock, Unlock, ChevronDown, ChevronRight, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Hint } from '@/types/learning';

interface Props {
  hints: Hint[];
  onHintReveal?: (level: number) => void;
}

const HINT_LABELS = ['Observation', 'Data Structure', 'Algorithm', 'Pseudo Logic', 'Implementation Advice', 'Full Solution'];

export function ProgressiveHints({ hints, onHintReveal }: Props) {
  const [revealedUpTo, setRevealedUpTo] = useState(-1);
  const [expandedHint, setExpandedHint] = useState<number | null>(null);

  const revealNext = () => {
    const next = revealedUpTo + 1;
    if (next < hints.length) {
      setRevealedUpTo(next);
      setExpandedHint(next);
      onHintReveal?.(next);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-semibold text-foreground">Hints</h4>
        </div>
        {revealedUpTo < hints.length - 1 && (
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={revealNext}>
            <Unlock className="w-3 h-3" />
            Reveal Hint {revealedUpTo + 2}
          </Button>
        )}
      </div>

      <div className="space-y-1">
        {hints.map((hint, i) => {
          const isRevealed = i <= revealedUpTo;
          const isExpanded = expandedHint === i;
          const label = HINT_LABELS[i] || `Hint ${i + 1}`;

          return (
            <div key={i} className="rounded-lg border border-border/30 overflow-hidden">
              <button
                onClick={() => {
                  if (isRevealed) setExpandedHint(isExpanded ? null : i);
                  else revealNext();
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                  isRevealed ? 'hover:bg-muted/20' : 'bg-muted/10 cursor-pointer',
                )}
              >
                <div className={cn(
                  'p-1 rounded-md',
                  isRevealed ? 'bg-amber-500/10' : 'bg-muted/20',
                )}>
                  {isRevealed
                    ? <Lightbulb className="w-3 h-3 text-amber-400" />
                    : <Lock className="w-3 h-3 text-muted-foreground/50" />
                  }
                </div>
                <span className={cn(
                  'text-[11px] font-medium flex-1',
                  isRevealed ? 'text-foreground' : 'text-muted-foreground/60',
                )}>
                  {label}
                </span>
                <Badge variant="outline" className={cn(
                  'text-[8px] px-1.5 py-0',
                  hint.difficulty === 'easy' && 'border-emerald-500/30 text-emerald-400',
                  hint.difficulty === 'medium' && 'border-yellow-500/30 text-yellow-400',
                  hint.difficulty === 'hard' && 'border-red-500/30 text-red-400',
                )}>
                  {hint.difficulty || i <= 1 ? 'gentle' : i <= 3 ? 'detailed' : 'explicit'}
                </Badge>
                {isRevealed && (
                  isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {isRevealed && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{hint.content}</p>
                      {hint.revealCode && (
                        <div className="p-2 rounded-md bg-muted/10 border border-border/20">
                          <div className="flex items-center gap-1 mb-1">
                            <Code2 className="w-2.5 h-2.5 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground">Hint Code</span>
                          </div>
                          <pre className="text-[10px] font-mono leading-relaxed text-foreground/80 whitespace-pre-wrap">
                            {hint.revealCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {revealedUpTo < 0 && (
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Each hint builds on the previous one. Try to solve after each hint.
        </p>
      )}
    </Card>
  );
}
