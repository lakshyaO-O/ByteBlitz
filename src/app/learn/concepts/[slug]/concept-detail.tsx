'use client';

import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen, ChevronLeft, BarChart3, Code2, Zap, HardDrive,
  CheckCircle2, XCircle, AlertTriangle, Link as LinkIcon,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ConceptEntry } from '@/types/learning';

export function ConceptDetail({ entry }: { entry: ConceptEntry }) {
  const [showCode, setShowCode] = useState(false);

  return (
    <Shell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/learn/concepts">
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{entry.title}</h1>
            <p className="text-xs text-muted-foreground">{entry.category.replace('-', ' ')}</p>
          </div>
        </div>

        <Card className="p-5 space-y-4">
          <div>
            <h2 className="text-xs font-semibold text-foreground mb-2">Definition</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{entry.definition}</p>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-foreground mb-2">How It Works</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{entry.visualExplanation}</p>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h2 className="text-xs font-semibold text-foreground">Complexity</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/10 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Time</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] text-muted-foreground/60">Worst</p>
                  <p className="text-xs font-bold font-mono text-foreground">{entry.complexity.timeWorst}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground/60">Average</p>
                  <p className="text-xs font-bold font-mono text-foreground">{entry.complexity.timeAverage}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground/60">Best</p>
                  <p className="text-xs font-bold font-mono text-foreground">{entry.complexity.timeBest}</p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/10 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Space</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] text-muted-foreground/60">Worst</p>
                  <p className="text-xs font-bold font-mono text-foreground">{entry.complexity.spaceWorst}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground/60">Average</p>
                  <p className="text-xs font-bold font-mono text-foreground">{entry.complexity.spaceAverage}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground/60">Best</p>
                  <p className="text-xs font-bold font-mono text-foreground">{entry.complexity.spaceBest}</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{entry.complexity.explanation}</p>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="text-[11px] font-semibold text-foreground">When to Use</h3>
            </div>
            <ul className="space-y-1">
              {entry.whenToUse.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <span className="text-emerald-400/60 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <h3 className="text-[11px] font-semibold text-foreground">When NOT to Use</h3>
            </div>
            <ul className="space-y-1">
              {entry.whenNotToUse.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <span className="text-red-400/60 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {entry.pitfalls.length > 0 && (
          <Card className="p-4 space-y-2 border-amber-500/20">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="text-[11px] font-semibold text-foreground">Common Pitfalls</h3>
            </div>
            <ul className="space-y-1">
              {entry.pitfalls.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <span className="text-amber-400/60 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {entry.codeExample && (
          <Card className="p-4 space-y-2">
            <button
              onClick={() => setShowCode(!showCode)}
              className="flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="text-[11px] font-semibold text-foreground">Code Example</h3>
              <Badge variant="outline" className="text-[8px] px-1 py-0 ml-2">
                {showCode ? 'Hide' : 'Show'}
              </Badge>
            </button>
            {showCode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <pre className="p-3 rounded-lg bg-muted/20 border border-border/30 text-[11px] font-mono leading-relaxed overflow-x-auto">
                  <code>{entry.codeExample}</code>
                </pre>
              </motion.div>
            )}
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {entry.relatedConcepts.map(rc => {
            const related = typeof rc === 'object' ? rc : { slug: rc, title: rc.replace(/-/g, ' ') };
            const slug = typeof rc === 'string' ? rc : related.slug;
            const title = typeof rc === 'string' ? rc.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : related.title;
            return (
              <Link key={slug} href={`/learn/concepts/${slug}`}>
                <Badge variant="secondary" className="text-[9px] px-2 py-0.5 gap-1 cursor-pointer hover:bg-secondary/80 transition-colors">
                  <LinkIcon className="w-2.5 h-2.5" />
                  {title}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
