'use client';

import { motion } from 'framer-motion';
import {
  Sword,
  Code2,
  Trophy,
  Zap,
  Users,
  BarChart3,
  Timer,
  MessageSquare,
} from 'lucide-react';

const features = [
  {
    icon: Sword,
    title: 'Real-time 1v1 Battles',
    desc: 'Match against opponents at your skill level. Solve the same problem faster and with fewer errors to win. ELO rating adjusts after every match.',
  },
  {
    icon: Code2,
    title: 'Multi-language Editor',
    desc: 'Built-in code editor with syntax highlighting for JavaScript, TypeScript, Python, Java, and C++. Write, test, and submit without leaving the browser.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Feedback',
    desc: 'Get instant code reviews, debugging assistance, and problem hints powered by Gemini. Learn from your mistakes with detailed explanations.',
  },
  {
    icon: Trophy,
    title: 'ELO Ranking & Tiers',
    desc: 'Every battle affects your ELO rating. Climb through Beginner to Grandmaster tiers. Compete on global and weekly leaderboards.',
  },
  {
    icon: Users,
    title: 'Private Rooms & Study Groups',
    desc: 'Create private rooms to battle friends. Form study groups to solve problems collaboratively. Practice without ELO pressure in study rooms.',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    desc: 'Detailed stats, coding heatmaps, win/loss records, and problem-solving trends track your growth over time.',
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
      <div className="container px-4 mx-auto relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground mb-4">
            Everything you need to{' '}
            <span className="text-primary">compete</span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base">
            Practice problems, real-time battles, AI coaching, and rankings — all in one platform.
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
              className="group relative p-8 bg-card/30 border border-border/50 hover:border-border transition-all duration-500"
            >
              <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-6">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>

              <h3 className="text-lg font-headline font-bold text-foreground tracking-tight mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
