'use client';

import { motion } from 'framer-motion';
import { UserPlus, Code2, Swords, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Your Account',
    desc: 'Sign up in seconds with email or Google. Pick your handle and enter the arena.',
  },
  {
    icon: Code2,
    title: 'Practice Coding',
    desc: 'Hone your skills with challenges across multiple languages and difficulty levels.',
  },
  {
    icon: Swords,
    title: 'Compete with Players',
    desc: 'Join matchmaking or create private rooms. Battle opponents in real-time coding duels.',
  },
  {
    icon: TrendingUp,
    title: 'Improve Your Rank',
    desc: 'Climb the global leaderboard. Earn XP, unlock tiers, and master the craft.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function HowItWorksSection() {
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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-black tracking-tight text-foreground uppercase mb-4">
            How It{' '}
            <span className="text-primary">Works</span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base">
            Four simple steps to start your competitive coding journey.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={itemVariants}
              className="relative text-center group"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 mx-auto bg-card border border-border group-hover:border-primary/50 transition-colors duration-300 flex items-center justify-center rounded-none">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-px bg-primary/30" />
                )}
              </div>

              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-headline font-bold mb-4">
                {index + 1}
              </div>

              <h3 className="text-base font-headline font-bold text-foreground uppercase tracking-tight mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
