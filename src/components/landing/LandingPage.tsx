'use client';

import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { StatsSection } from './StatsSection';
import { LandingFooter } from './Footer';

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <HeroSection />
      <div className="h-px bg-border/50 mx-auto max-w-4xl" />
      <FeaturesSection />
      <div className="h-px bg-border/50 mx-auto max-w-4xl" />
      <HowItWorksSection />
      <div className="h-px bg-border/50 mx-auto max-w-4xl" />
      <StatsSection />
      <LandingFooter />
    </div>
  );
}
