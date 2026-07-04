'use client';

import { motion } from 'framer-motion';
import { AnimatedBackground } from './AnimatedBackground';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { StatsSection } from './StatsSection';
import { LandingFooter } from './Footer';

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

function SectionDivider() {
  return (
    <motion.div
      className="h-px bg-primary/20 mx-auto max-w-4xl"
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
    />
  );
}

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <AnimatedBackground />

      <motion.div
        className="relative z-10"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <HeroSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <HowItWorksSection />
        <SectionDivider />
        <StatsSection />
        <LandingFooter />
      </motion.div>
    </div>
  );
}
