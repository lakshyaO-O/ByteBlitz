'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, Sparkles, ChevronDown, ChevronRight, Code2, AlertTriangle, TrendingUp, BookOpen, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { MentorExplanation, MentorLevel } from '@/types/learning';

interface Props {
  explanation?: MentorExplanation;
  loading?: boolean;
  level: MentorLevel;
  onLevelChange: (level: MentorLevel) => void;
  onRequestExplanation?: () => void;
}

const LEVELS: { key: MentorLevel; label: string; color: string }[] = [
  { key: 'beginner', label: 'Beginner', color: 'text-emerald-400' },
  { key: 'intermediate', label: 'Intermediate', color: 'text-amber-400' },
  { key: 'expert', label: 'Expert', color: 'text-red-400' },
];

export function AIExplainer({ explanation, loading, level, onLevelChange, onRequestExplanation }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['intuition', 'approach']));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sections = explanation ? [
    { id: 'intuition', icon: Lightbulb, label: 'Intuition', content: explanation.intuition, color: 'text-amber-400' },
    { id: 'why', icon: Brain, label: 'Why This Works', content: explanation.whyItWorks, color: 'text-violet-400' },
    { id: 'approach', icon: BookOpen, label: 'Approach', content: explanation.approach, color: 'text-blue-400' },
    { id: 'complexity', icon: TrendingUp, label: 'Complexity', content: `Time: ${explanation.complexity.timeWorst} (worst), ${explanation.complexity.timeAverage} (avg), ${explanation.complexity.timeBest} (best) | Space: ${explanation.complexity.spaceWorst} — ${explanation.complexity.explanation}`, color: 'text-rose-400' },
    { id: 'edge-cases', icon: AlertTriangle, label: 'Edge Cases', content: explanation.edgeCases.map(e => `• ${e}`).join('\n'), color: 'text-amber-400' },
    { id: 'mistakes', icon: AlertTriangle, label: 'Common Mistakes', content: explanation.commonMistakes.map(m => `• ${m}`).join('\n'), color: 'text-red-400' },
  ] : [];

  return (
    <Card className="overflow-hidden border-border/40">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500/10">
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">AI Mentor</h4>
          </div>

          <div className="flex items-center gap-1 bg-muted/10 rounded-lg p-0.5">
            {LEVELS.map(l => (
              <button
                key={l.key}
                onClick={() => onLevelChange(l.key)}
                className={cn(
                  'px-2 py-1 rounded-md text-[10px] font-medium transition-all',
                  level === l.key
                    ? `bg-background shadow-sm ${l.color}`
                    : 'text-muted-foreground/60 hover:text-muted-foreground',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            <p className="text-[11px] text-muted-foreground">Generating {level} explanation...</p>
          </div>
        ) : !explanation ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Brain className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Get an AI-powered explanation tailored to your level. Choose Beginner, Intermediate, or Expert above.
            </p>
            {onRequestExplanation && (
              <Button variant="default" size="sm" className="h-8 text-xs gap-1.5" onClick={onRequestExplanation}>
                <Sparkles className="w-3.5 h-3.5" />
                Explain This Problem
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {sections.map(s => {
              const isExpanded = expandedSections.has(s.id);
              return (
                <div key={s.id} className="rounded-lg border border-border/20 overflow-hidden">
                  <button
                    onClick={() => toggleSection(s.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/10 transition-colors"
                  >
                    <s.icon className={cn('w-3.5 h-3.5', s.color)} />
                    <span className="text-[11px] font-medium flex-1">{s.label}</span>
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3">
                          <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{s.content}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {explanation.alternatives.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/10 border border-border/30">
                <p className="text-[10px] font-medium text-foreground mb-2">Alternative Approaches</p>
                <ul className="space-y-1">
                  {explanation.alternatives.map((alt, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                      <span className="text-muted-foreground/40 mt-0.5">•</span>
                      {alt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {explanation.interviewPerspective && (
              <div className="p-2.5 rounded-md bg-blue-500/5 border border-blue-500/20">
                <p className="text-[10px] text-blue-300">{explanation.interviewPerspective}</p>
              </div>
            )}

            {explanation.realWorldApplications && explanation.realWorldApplications.length > 0 && (
              <div className="p-2.5 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] font-medium text-emerald-400/80">Real-World Applications</span>
                </div>
                <ul className="space-y-0.5">
                  {explanation.realWorldApplications.map((app, i) => (
                    <li key={i} className="text-[10px] text-emerald-300/60">{app}</li>
                  ))}
                </ul>
              </div>
            )}

            {explanation.codeSnippet && (
              <div className="p-2.5 rounded-md bg-muted/10 border border-border/20">
                <div className="flex items-center gap-1 mb-1">
                  <Code2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">Illustrative Code</span>
                </div>
                <pre className="text-[10px] font-mono leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {explanation.codeSnippet}
                </pre>
              </div>
            )}

            {explanation.optimizationOpportunities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {explanation.optimizationOpportunities.map((opt, i) => (
                  <Badge key={i} variant="outline" className="text-[8px] px-1.5 py-0 border-amber-500/20 text-amber-400/80">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    {opt}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
