'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Calendar,
  Trophy,
  Users,
  Bell,
  Code2,
  Rocket,
  Sparkles,
  Swords,
  Mail,
  ArrowRight,
  ChevronRight,
  Shield,
  Globe,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Web3', 'AI/ML', 'Mobile', 'DevTools', 'Open Source', 'Design', 'Hardware'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const NEXT_EVENT_DATE = new Date();
NEXT_EVENT_DATE.setDate(NEXT_EVENT_DATE.getDate() + 14);
NEXT_EVENT_DATE.setHours(NEXT_EVENT_DATE.getHours() + 8);

function useCountdown(target: Date) {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return;
      setRemaining({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return remaining;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl sm:text-3xl font-headline font-black tabular-nums text-foreground">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </span>
    </div>
  );
}

function EmptySectionCard({
  icon: Icon,
  title,
  description,
  badge,
  className,
}: {
  icon: any;
  title: string;
  description: string;
  badge?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-dashed border-border/40 bg-muted/5 p-8',
        className
      )}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border border-primary/10">
          <Icon className="w-8 h-8 text-primary/60" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-base font-headline font-bold">{title}</h4>
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        </div>
        {badge && (
          <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20 text-[10px] uppercase tracking-widest font-bold">
            {badge}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

function EventPlaceholderCard({
  icon: Icon,
  title,
  description,
  tags,
  actionLabel,
  onAction,
  badgeText,
  badgeVariant,
  comingSoon,
}: {
  icon: any;
  title: string;
  description: string;
  tags?: string[];
  actionLabel?: string;
  onAction?: () => void;
  badgeText?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
  comingSoon?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="group relative overflow-hidden border-border/50 bg-card/30 hover:border-primary/20 hover:bg-card/50 transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shrink-0 border border-primary/5">
              <Icon className="w-7 h-7 text-primary/60" />
            </div>
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-lg font-headline font-bold text-foreground/80">{title}</h3>
                {badgeText && (
                  <Badge
                    variant={badgeVariant || 'outline'}
                    className={cn(
                      'text-[9px] uppercase tracking-widest font-bold',
                      badgeVariant === 'default' && 'bg-primary/10 text-primary border-primary/30',
                      !badgeVariant && 'bg-muted/30 text-muted-foreground border-border/40'
                    )}
                  >
                    {badgeText}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">{description}</p>
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-muted/20 text-[10px] font-mono text-muted-foreground/60 border border-border/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {actionLabel && onAction && (
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5 border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40"
                    onClick={onAction}
                  >
                    {actionLabel}
                    <Bell className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            {comingSoon && (
              <div className="hidden sm:flex flex-col items-center justify-center px-3 py-2 rounded-lg bg-secondary/5 border border-secondary/10">
                <Sparkles className="w-4 h-4 text-secondary/60 mb-1" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-secondary/50">Soon</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function HackathonsPage() {
  const { toast } = useToast();
  const [notified, setNotified] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All');

  const countdown = useCountdown(NEXT_EVENT_DATE);

  const handleNotify = useCallback(() => {
    if (notified) {
      toast({ title: 'Already registered!', description: "You're on the list. We'll notify you when new events drop." });
      return;
    }
    setNotified(true);
    toast({
      title: 'Notification set!',
      description: 'We\'ll alert you when new challenges and hackathons are announced.',
    });
  }, [notified, toast]);

  const tabs = [
    { value: 'upcoming', label: 'Upcoming', icon: Calendar },
    { value: 'active', label: 'Active', icon: Zap },
    { value: 'past', label: 'Past', icon: Trophy },
  ] as const;

  return (
    <Shell>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-headline font-black uppercase tracking-tighter text-foreground">
            CHALLENGES & HACK<span className="text-primary neon-text">ATHONS</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Compete in coding challenges and hackathons. Build real projects, collaborate with teams, win prizes, and level up your developer profile.
          </p>
        </div>

        {/* Tabs + Filters */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/30">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all',
                    activeTab === tab.value
                      ? 'bg-background text-foreground shadow-sm border border-border/50'
                      : 'text-muted-foreground/60 hover:text-foreground/80'
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border',
                    activeCategory === cat
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-transparent text-muted-foreground/50 border-transparent hover:text-muted-foreground hover:border-border/30'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDifficulty(d)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all',
                    activeDifficulty === d
                      ? 'text-primary'
                      : 'text-muted-foreground/40 hover:text-muted-foreground/70'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Calendar, label: 'Coming Challenges', value: '3', color: 'text-primary' },
            { icon: Rocket, label: 'Upcoming Hackathons', value: '2', color: 'text-secondary' },
            { icon: Trophy, label: 'Prize Pool', value: '$50K+', color: 'text-orange-400' },
            { icon: Users, label: 'Active Participants', value: '1.2K+', color: 'text-emerald-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <Card className="bg-card/40 border-border/40 hover:border-primary/20 transition-colors">
                <CardContent className="p-5 text-center space-y-2">
                  <stat.icon className={cn('w-6 h-6 mx-auto', stat.color)} />
                  <div className={cn('text-2xl font-headline font-black', stat.color)}>{stat.value}</div>
                  <div className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Featured Event – Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-secondary/[0.04] to-background">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />

            <div className="relative p-8 sm:p-10 lg:p-12">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] uppercase tracking-widest font-bold px-3 py-1">
                      <Sparkles className="w-3 h-3 mr-1.5" /> Next Event
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground/50">Season 2</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-black tracking-tight">
                    DevRann Code Fest
                  </h2>

                  <p className="text-muted-foreground/80 max-w-xl leading-relaxed">
                    A multi-round coding marathon featuring algorithmic challenges, system design rounds, and a grand finale hackathon. Compete solo or in teams for a share of the prize pool.
                  </p>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
                      <Calendar className="w-4 h-4 text-primary/60" />
                      <span className="font-mono text-xs">Starts in</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CountdownUnit value={countdown.days} label="Days" />
                      <span className="text-muted-foreground/20 font-mono text-lg">:</span>
                      <CountdownUnit value={countdown.hours} label="Hrs" />
                      <span className="text-muted-foreground/20 font-mono text-lg">:</span>
                      <CountdownUnit value={countdown.minutes} label="Min" />
                      <span className="text-muted-foreground/20 font-mono text-lg">:</span>
                      <CountdownUnit value={countdown.seconds} label="Sec" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button onClick={handleNotify} className="gap-2" size="lg">
                      <Bell className="w-4 h-4" />
                      {notified ? 'Notification Set ✓' : 'Notify Me'}
                    </Button>
                    <Button variant="outline" size="lg" className="gap-2 opacity-60 cursor-not-allowed" disabled>
                      View Details <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="hidden lg:flex flex-col items-center gap-4 p-6 rounded-xl bg-muted/10 border border-border/30 min-w-[200px]">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/10">
                    <Trophy className="w-8 h-8 text-orange-400/80" />
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-headline font-black text-orange-400/80">$25K+</div>
                    <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">Prize Pool</div>
                  </div>
                  <div className="w-full h-px bg-border/30" />
                  <div className="text-center space-y-1">
                    <div className="text-lg font-headline font-bold text-foreground/60">500+</div>
                    <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">Expected Participants</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Upcoming Challenges */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-primary/30" />
              <h2 className="text-xl sm:text-2xl font-headline font-bold">Upcoming Challenges</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground/60" disabled>
              View All <ChevronRight className="w-3 h-3" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <EventPlaceholderCard
              icon={Swords}
              title="Weekly Sprint #42"
              description="Solve 5 algorithmic problems under time pressure. Topics: arrays, graphs, and dynamic programming."
              tags={['Algorithms', 'Medium', 'Solo']}
              badgeText="Coming Soon"
              actionLabel="Notify Me"
              onAction={handleNotify}
            />
            <EventPlaceholderCard
              icon={Code2}
              title="DSA Showdown"
              description="Head-to-head data structure battles. Rank up by solving faster than your opponent."
              tags={['DSA', 'Hard', '1v1']}
              badgeText="Coming Soon"
              actionLabel="Notify Me"
              onAction={handleNotify}
            />
            <EventPlaceholderCard
              icon={Shield}
              title="Bug Bash"
              description="Find and fix hidden bugs across multiple codebases. Fastest debugger wins."
              tags={['Debugging', 'All Levels', 'Solo']}
              badgeText="Coming Soon"
              actionLabel="Notify Me"
              onAction={handleNotify}
            />
          </div>
        </section>

        {/* Upcoming Hackathons */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-secondary to-secondary/30" />
              <h2 className="text-xl sm:text-2xl font-headline font-bold">Upcoming Hackathons</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground/60" disabled>
              View All <ChevronRight className="w-3 h-3" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <EventPlaceholderCard
              icon={Rocket}
              title="AI Innovation Sprint"
              description="Build an AI-powered tool in 48 hours. Use any stack, any framework. Judged on creativity, impact, and polish."
              tags={['AI/ML', 'Team (2-4)', '48hrs']}
              badgeText="Coming Soon"
              comingSoon
              actionLabel="Notify Me"
              onAction={handleNotify}
            />
            <EventPlaceholderCard
              icon={Globe}
              title="Open Source Hack"
              description="Contribute to open source projects. Submit meaningful PRs to participating repos and win swag."
              tags={['Open Source', 'Solo/Team', '72hrs']}
              badgeText="Coming Soon"
              comingSoon
              actionLabel="Notify Me"
              onAction={handleNotify}
            />
          </div>
        </section>

        {/* Past Events */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/10" />
              <h2 className="text-xl sm:text-2xl font-headline font-bold text-muted-foreground/70">Past Events</h2>
            </div>
          </div>

          <EmptySectionCard
            icon={Trophy}
            title="No past events yet"
            description="Completed challenges and hackathons will appear here with results, leaderboards, and prize winners."
            className="border-muted/20"
          />
        </section>

        {/* Host an Event */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-dashed border-secondary/30 bg-gradient-to-br from-secondary/[0.04] to-transparent">
            <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full blur-2xl" />

            <CardContent className="p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/15 to-primary/10 flex items-center justify-center shrink-0 border border-secondary/10">
                  <Mail className="w-10 h-10 text-secondary/60" />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <h3 className="text-xl font-headline font-bold">Want to host an event?</h3>
                    <Badge
                      variant="outline"
                      className="bg-secondary/10 text-secondary border-secondary/25 text-[9px] uppercase tracking-widest font-bold px-2.5"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground/70 max-w-xl">
                    Apply as an organizer to host your own coding challenge or hackathon on DevRann. We provide the platform, infrastructure, and community — you bring the vision.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="shrink-0 gap-2 border-secondary/30 text-secondary/70 cursor-not-allowed opacity-60"
                  disabled
                >
                  Apply as Organizer <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Shell>
  );
}
