'use client';

import { Card } from '@/components/ui/card';
import { Brain, Code2, BookOpen, BarChart3, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const features = [
  { icon: Brain, label: 'AI Mentor', href: '/ai-mentor', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Code2, label: 'Code Review', href: '/ai-code-review', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: BookOpen, label: 'Learn Concepts', href: '/learn/concepts', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics/learning', color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

export function JudgeStatus() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-violet-500/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(96,165,250,0.06),transparent_60%)]" />
        <div className="relative p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">Secure Online Judge — Deploying</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Our code execution infrastructure is being deployed to ensure every submission runs in a secure, isolated environment.
                While you wait, the entire learning platform is available — no execution needed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {features.map((f) => (
              <Link key={f.label} href={f.href}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-background/50 border border-border/50
                  hover:bg-background/80 hover:border-border/80 transition-all group"
              >
                <div className={`p-1.5 rounded-lg ${f.bg}`}>
                  <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {f.label}
                </span>
                <ArrowRight className="w-3 h-3 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground/60 text-center">
            Judge will be ready soon. In the meantime, master the fundamentals with AI-powered guidance.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
