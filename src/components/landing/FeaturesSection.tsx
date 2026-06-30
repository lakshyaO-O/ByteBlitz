'use client';

import { motion } from 'framer-motion';
import {
  Sword,
  Brain,
  Trophy,
  Target,
  Users,
  BarChart3,
} from 'lucide-react';

const features = [
  {
    icon: Sword,
    title: 'Competitive Coding Battles',
    desc: 'Face opponents in real-time 1v1 coding duels. First to solve wins. Every millisecond counts.',
    gradient: 'from-primary to-cyan-400',
  },
  {
    icon: Brain,
    title: 'AI Code Review',
    desc: 'Get instant feedback on your solutions. Learn from AI-powered analysis and improve rapidly.',
    gradient: 'from-secondary to-purple-400',
  },
  {
    icon: Trophy,
    title: 'Live Leaderboards',
    desc: 'Climb the global ELO rankings. Compete for the top spot and earn exclusive rewards.',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    icon: Target,
    title: 'Coding Challenges',
    desc: 'Sharpen your skills with curated problems across multiple difficulty levels and categories.',
    gradient: 'from-emerald-400 to-green-500',
  },
  {
    icon: Users,
    title: 'Real-Time Multiplayer',
    desc: 'Create private rooms or jump into matchmaking. Compete with friends or strangers worldwide.',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    desc: 'Monitor your growth with detailed stats. Track wins, rating changes, and problem-solving trends.',
    gradient: 'from-pink-400 to-rose-500',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function FeaturesSection() {
  return (
    <section className="relative py-32 border-t border-border/50">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <div className="container px-4 mx-auto relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-black tracking-tight text-foreground uppercase mb-4">
            Built for{' '}
            <span className="text-primary">Champions</span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base">
            Everything you need to sharpen your coding skills and compete at the highest level.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative p-8 bg-card/30 border border-border/50 hover:border-border backdrop-blur-sm transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.gradient} mb-6`}>
                <feature.icon className="w-6 h-6 text-background" />
              </div>

              <h3 className="text-lg font-headline font-bold text-foreground uppercase tracking-tight mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>

              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-center" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
