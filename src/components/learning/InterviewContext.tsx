'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, ChevronRight, Lightbulb, ArrowRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { InterviewContext as InterviewContextType } from '@/types/learning';

interface Props {
  context: InterviewContextType;
}

export function InterviewContextCard({ context }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-4 space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left"
      >
        <div className="p-1.5 rounded-lg bg-blue-500/10">
          <Building2 className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-semibold text-foreground">Interview Context</h4>
          {!expanded && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{context.whyAsked.slice(0, 60)}...</p>
          )}
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
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
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">{context.whyAsked}</p>

              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-blue-400" />
                  Companies
                </span>
                <div className="flex flex-wrap gap-1">
                  {context.companies.map(c => (
                    <Badge key={c} variant="secondary" className="text-[9px] px-1.5 py-0">{c}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-foreground flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                  Variations
                </span>
                <ul className="space-y-1">
                  {context.variations.map((v, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                      <span className="text-muted-foreground/40 mt-0.5">•</span>
                      {v}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-foreground flex items-center gap-1.5">
                  <HelpCircle className="w-3 h-3 text-violet-400" />
                  Follow-up Questions
                </span>
                <ul className="space-y-1">
                  {context.followUpQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                      <Lightbulb className="w-2.5 h-2.5 text-amber-400/60 mt-0.5 shrink-0" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>

              {context.difficultyProgression.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-medium text-foreground">Difficulty Progression</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {context.difficultyProgression.map((d, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Badge variant="outline" className={cn(
                          'text-[8px] px-1.5 py-0',
                          d.toLowerCase().includes('easy') && 'border-emerald-500/30 text-emerald-400',
                          d.toLowerCase().includes('medium') && 'border-amber-500/30 text-amber-400',
                          d.toLowerCase().includes('hard') && 'border-red-500/30 text-red-400',
                        )}>
                          {d}
                        </Badge>
                        {i < context.difficultyProgression.length - 1 && (
                          <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/30" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
