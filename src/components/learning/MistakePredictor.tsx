'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, ChevronDown, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { MistakePrediction } from '@/types/learning';

interface Props {
  predictions: MistakePrediction[];
  loading?: boolean;
  onAnalyze?: () => void;
}

const LIKELIHOOD_COLORS = {
  high: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
  low: { bg: 'bg-muted/20', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export function MistakePredictor({ predictions, loading, onAnalyze }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-semibold text-foreground">Watch Out For</h4>
        </div>
        {onAnalyze && predictions.length === 0 && !loading && (
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={onAnalyze}>
            <Sparkles className="w-3 h-3" />
            Analyze Mistakes
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : predictions.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/60 text-center py-4">
          AI-powered mistake analysis will help you avoid common pitfalls.
        </p>
      ) : (
        <div className="space-y-1">
          {predictions.map((p, i) => {
            const colors = LIKELIHOOD_COLORS[p.likelihood];
            const isExpanded = expanded === i;

            return (
              <div key={i} className="rounded-lg border border-border/30 overflow-hidden">
                <button
                  onClick={() => setExpanded(isExpanded ? null : i)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/10 transition-colors"
                >
                  <div className={cn('p-1 rounded-md', colors.bg)}>
                    <Shield className={cn('w-3 h-3', colors.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-foreground">{p.category}</span>
                      <div className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('text-[8px] px-1.5 py-0 capitalize', colors.text, colors.bg)}>
                    {p.likelihood}
                  </Badge>
                  {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{p.explanation}</p>
                        <div className="p-2 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                          <p className="text-[10px] font-medium text-emerald-400 mb-0.5">How to avoid:</p>
                          <p className="text-[10px] text-muted-foreground">{p.prevention}</p>
                        </div>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                          {p.relatedTopic}
                        </Badge>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
