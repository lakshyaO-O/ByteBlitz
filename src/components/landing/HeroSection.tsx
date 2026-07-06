'use client';

import { motion } from 'framer-motion';
import { Code2, Zap, Timer, Trophy, Users, ArrowRight, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase/auth/use-user';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32">
      <div className="container px-4 mx-auto relative z-10">
        <motion.div
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-headline font-bold uppercase tracking-widest mb-8"
            variants={itemVariants}
          >
            <Zap className="w-3.5 h-3.5 fill-primary" />
            Early Access — Join the Arena
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-headline font-bold tracking-tight text-foreground leading-[1.05] mb-6"
            variants={itemVariants}
          >
            Solve coding problems.{' '}
            <span className="text-primary">Battle in real time.</span>{' '}
            Climb the ranks.
          </motion.h1>

          <motion.p
            className="max-w-2xl text-lg sm:text-xl text-muted-foreground font-body mb-10"
            variants={itemVariants}
          >
            Practice DSA with instant feedback, face opponents in 1v1 coding duels,
            and track your ELO rating. Supports Python, JavaScript, C++, Java, and TypeScript.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 mb-12"
            variants={itemVariants}
          >
            <Link
              href="/auth?mode=register"
              className="group relative inline-flex items-center justify-center gap-2 h-14 px-10 text-base font-headline font-bold text-background bg-primary hover:bg-primary/90 transition-colors"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/auth?mode=login"
              className="group relative inline-flex items-center justify-center gap-2 h-14 px-10 text-base font-headline font-bold border border-border bg-background/50 text-foreground hover:bg-muted transition-colors"
            >
              <span className="relative z-10 flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </span>
            </Link>

            <Link
              href="/practice"
              className="group relative inline-flex items-center justify-center gap-2 h-14 px-10 text-base font-headline font-bold border border-border bg-background/50 text-foreground hover:bg-muted transition-colors"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Try Practice
              </span>
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl"
            variants={itemVariants}
          >
            {[
              { icon: Code2, label: 'Multi-language', desc: 'JS, TS, Python, Java, C++' },
              { icon: Zap, label: '1v1 Battles', desc: 'Real-time coding duels with ELO' },
              { icon: Timer, label: 'AI Feedback', desc: 'Instant code review & hints' },
              { icon: Trophy, label: 'Leaderboard', desc: 'Global rankings & tiers' },
            ].map((feature) => (
              <div key={feature.label} className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/30">
                <feature.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12 flex items-center gap-6 text-xs text-muted-foreground"
            variants={itemVariants}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Early Access — Free to use
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Real-time battles via Firestore
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
