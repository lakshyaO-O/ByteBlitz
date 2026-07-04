'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HintsPanelProps {
  hints: string[];
}

export function HintsPanel({ hints }: HintsPanelProps) {
  const [revealedHints, setRevealedHints] = useState<number>(0);

  if (!hints || hints.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-medium text-muted-foreground">Hints</span>
        </div>
        <span className="text-xs text-muted-foreground">{revealedHints}/{hints.length}</span>
      </div>
      {hints.slice(0, revealedHints).map((hint, i) => (
        <div
          key={i}
          className="p-3 rounded bg-yellow-500/5 border border-yellow-500/20 text-sm text-muted-foreground leading-relaxed"
        >
          <span className="font-medium text-yellow-400">Hint {i + 1}:</span> {hint}
        </div>
      ))}
      {revealedHints < hints.length && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs gap-1 text-yellow-400 hover:text-yellow-300"
          onClick={() => setRevealedHints(prev => Math.min(prev + 1, hints.length))}
        >
          <ChevronDown className="w-3 h-3" /> Reveal Hint {revealedHints + 1}
        </Button>
      )}
      {revealedHints >= hints.length && revealedHints > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs gap-1 text-muted-foreground"
          onClick={() => setRevealedHints(0)}
        >
          <ChevronUp className="w-3 h-3" /> Hide Hints
        </Button>
      )}
    </div>
  );
}
