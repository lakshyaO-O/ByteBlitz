'use client';

import { motion } from 'framer-motion';
import { Zap, ArrowRight, LogIn, Eye } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase/auth/use-user';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.5 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const glowVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1.2 } },
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32">
      <motion.div
        className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, hsl(184 100% 55% / 0.15), transparent 70%)',
        }}
        variants={glowVariants}
        initial="hidden"
        animate="visible"
      />
      <motion.div
        className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, hsl(271 76% 53% / 0.12), transparent 70%)',
        }}
        variants={glowVariants}
        initial="hidden"
        animate="visible"
      />

      <motion.div
        className="container px-4 mx-auto text-center relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-headline font-bold uppercase tracking-widest mb-8"
          variants={itemVariants}
        >
          <Zap className="w-3.5 h-3.5 fill-primary" />
          Season 1 is Live: The Nexus Protocol
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-headline font-black tracking-tighter text-foreground uppercase leading-[0.85]">
            CODEZ<span className="text-primary inline-block" style={{ textShadow: '0 0 30px hsl(184 100% 55% / 0.6), 0 0 60px hsl(184 100% 55% / 0.3)' }}>ARENA</span>
          </h1>
        </motion.div>

        <motion.p
          className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground font-body mb-4"
          variants={itemVariants}
        >
          Master Coding. Compete Globally.
        </motion.p>

        <motion.p
          className="max-w-xl mx-auto text-sm text-muted-foreground/70 font-body mb-12"
          variants={itemVariants}
        >
          The high-octane coding arena where logic meets speed. Compete in 1v1 battles,
          climb the ELO ladder, and become a legendary architect.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          variants={itemVariants}
        >
          <Link
            href="/auth?mode=register"
            className="group relative inline-flex items-center justify-center gap-2 h-14 px-10 text-base font-headline font-bold text-background rounded-none overflow-hidden"
          >
            <span className="absolute inset-0 bg-primary transition-transform duration-300 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex items-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/auth?mode=login"
            className="group relative inline-flex items-center justify-center gap-2 h-14 px-10 text-base font-headline font-bold border border-border bg-background/50 backdrop-blur-sm text-foreground hover:bg-muted rounded-none overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </span>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
          >
            <Eye className="w-3.5 h-3.5" />
            Continue as Guest
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        <motion.div
          className="mt-12 flex items-center justify-center gap-6 text-xs text-muted-foreground"
          variants={itemVariants}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            10k+ Developers
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Real-time Battles
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            Free to Play
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
