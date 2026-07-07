'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, ChevronDown, ChevronRight, Loader2, Sparkles, Zap, HardDrive, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { ComplexityAnalysis } from '@/types/learning';

interface Props {
  complexity?: ComplexityAnalysis;
  loading?: boolean;
  onAnalyze?: (code: string) => void;
  code?: string;
}

export function ComplexityCard({ complexity, loading, onAnalyze, code }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <h4 className="text-xs font-semibold text-foreground">Complexity</h4>
        </div>
        {!complexity && !loading && onAnalyze && (
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => onAnalyze(code || '')}>
            <Sparkles className="w-3 h-3" />
            Analyze
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : !complexity ? (
        <p className="text-[11px] text-muted-foreground/60 text-center py-4">
          Submit your code for AI-powered complexity analysis.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-muted/10 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] font-medium text-muted-foreground uppercase">Time</span>
              </div>
              <p className="text-xs font-bold font-mono text-foreground">{complexity.timeWorst}</p>
              <div className="flex gap-2 mt-1 text-[9px] text-muted-foreground/60">
                <span>Best: {complexity.timeBest}</span>
                <span>Avg: {complexity.timeAverage}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/10 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1">
                <HardDrive className="w-3 h-3 text-blue-400" />
                <span className="text-[9px] font-medium text-muted-foreground uppercase">Space</span>
              </div>
              <p className="text-xs font-bold font-mono text-foreground">{complexity.spaceWorst}</p>
              <div className="flex gap-2 mt-1 text-[9px] text-muted-foreground/60">
                <span>Best: {complexity.spaceBest}</span>
                <span>Avg: {complexity.spaceAverage}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Why this complexity?
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-[11px] text-muted-foreground leading-relaxed">{complexity.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-1.5">
            {complexity.timeWorst !== complexity.timeBest && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-amber-500/20 text-amber-400/80">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                Varies by input
              </Badge>
            )}
            {(complexity.spaceWorst === 'O(1)' || complexity.spaceWorst === 'O(log n)') && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-emerald-500/20 text-emerald-400/80">
                <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                Memory efficient
              </Badge>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
