import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, Sword, Trophy, Users, ShieldCheck, Github } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 flex flex-col items-center">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />
        
        <div className="container px-4 mx-auto text-center space-y-12 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-headline font-bold uppercase tracking-widest animate-bounce">
            <Zap className="w-3.5 h-3.5 fill-primary" />
            Season 1 is Live: The Nexus Protocol
          </div>
          
          <div className="space-y-6">
            <h1 className="text-7xl md:text-9xl font-headline font-black tracking-tighter text-foreground uppercase leading-[0.85]">
              CODEZ<span className="text-primary neon-text">ARENA</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground font-body">
              The high-octane coding arena where logic meets speed. Compete in 1v1 battles, climb the ELO ladder, and become a legendary architect.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-16 px-12 text-lg font-headline font-bold bg-primary text-background hover:bg-primary/90 rounded-none relative overflow-hidden group">
              <Link href="/arena">
                <span className="relative z-10 flex items-center gap-2">
                  <Sword className="w-5 h-5" /> ENTER THE ARENA
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-16 px-12 text-lg font-headline font-bold border-border hover:bg-muted rounded-none">
              <Link href="/problems">PRACTICE ZONE</Link>
            </Button>
          </div>

          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <StatItem value="12,542" label="Global Coders" />
            <StatItem value="1.2M+" label="Tests Passed" />
            <StatItem value="150ms" label="Avg Execution" />
            <StatItem value="24/7" label="Rated Battles" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Zap className="w-10 h-10 text-primary" />}
              title="1v1 Battle Engine"
              desc="Match against opponents with similar ELO in real-time. First one to solve the logic puzzle wins."
            />
            <FeatureCard 
              icon={<Trophy className="w-10 h-10 text-secondary" />}
              title="Progression System"
              desc="Earn XP and climb from Beginner to Master. Unlock exclusive profile cosmetics and badges."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-10 h-10 text-emerald-400" />}
              title="Secure Sandbox"
              desc="Your code runs in an isolated environment with rigorous limits on CPU and memory usage."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-headline font-bold tracking-tight text-foreground">CODEZARENA</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 CodezArena. Built for the modern architect.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Github className="w-5 h-5" /></Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Discord</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="text-3xl font-headline font-bold text-foreground">{value}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="space-y-6 group cursor-default">
      <div className="w-20 h-20 bg-muted flex items-center justify-center rounded-2xl group-hover:bg-primary/10 transition-colors border border-border group-hover:border-primary/50">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-headline font-bold uppercase tracking-tight text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
