'use client';

import { motion } from 'framer-motion';

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
  return (
    <section className="relative py-32 border-t border-border/50">
      <div className="container px-4 mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground mb-4">
            Built for{' '}
            <span className="text-primary">Competitive Coding</span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base">
            Practice, compete, and improve with real-time feedback and AI-powered tools.
          </p>
        </motion.div>

        <motion.div
          className="text-center max-w-xl mx-auto p-8 rounded-lg border border-border bg-card/30"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.p
            className="text-lg font-headline font-semibold text-foreground mb-2"
            variants={itemVariants}
          >
            Early Access
          </motion.p>
          <motion.p
            className="text-sm text-muted-foreground"
            variants={itemVariants}
          >
            DevRann is in early access. We are actively building the platform
            and growing our community. Join us and help shape the future of
            competitive coding.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
