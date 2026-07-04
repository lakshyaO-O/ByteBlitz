'use client';

import { motion } from 'framer-motion';
import { Users, Swords, Zap, Activity } from 'lucide-react';
import { useGlobalStats } from '@/firebase/stats/use-stats';

const statItems = [
  { icon: Users, label: 'Registered Players', key: 'totalPlayers' as const, suffix: '' },
  { icon: Swords, label: 'Total Battles', key: 'totalBattles' as const, suffix: '' },
  { icon: Zap, label: 'Avg Execution', key: 'avgExecutionTime' as const, suffix: 'ms' },
  { icon: Activity, label: 'Live Battles', key: 'activeBattles' as const, suffix: '' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function StatsSection() {
  const { stats, loading } = useGlobalStats();

  const getValue = (key: string): string => {
    if (loading) return '...';
    const value = (stats as any)[key];
    if (value === undefined || value === null) return '0';
    if (value === 0) return '0';
    if (key === 'avgExecutionTime') return `${value}`;
    return value.toLocaleString();
  };

  return (
    <section className="relative py-32 border-t border-border/50">
      <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />

      <div className="container px-4 mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-black tracking-tight text-foreground uppercase mb-4">
            Platform{' '}
            <span className="text-primary">Stats</span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base">
            Real-time metrics from the arena.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {statItems.map((item) => (
            <motion.div
              key={item.key}
              variants={itemVariants}
              className="relative p-8 bg-card/30 border border-border/50  text-center group hover:border-primary/30 transition-colors duration-300"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-none">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
              </div>

              <div className="text-3xl sm:text-4xl font-headline font-black text-foreground mb-2">
                {getValue(item.key)}{item.suffix && getValue(item.key) !== '...' && getValue(item.key) !== '0' ? (
                  <span className="text-primary text-lg ml-0.5">{item.suffix}</span>
                ) : null}
              </div>

              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                {item.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
