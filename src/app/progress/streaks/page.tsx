'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  Flame, Zap, Trophy, Gift, Calendar, Clock, Target,
  CheckCircle2, Lock, Sparkles, Medal, Star, Loader2,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const currentStreak = 7;
const longestStreak = 14;
const today = new Date('2026-07-02');

const milestones = [
  { days: 3, label: '3-Day Streak', reward: '100 XP + 20 Coins', icon: Flame, color: 'text-orange-400', achieved: currentStreak >= 3, claimed: false },
  { days: 7, label: '7-Day Streak', reward: '250 XP + 50 Coins + Badge', icon: Medal, color: 'text-yellow-400', achieved: currentStreak >= 7, claimed: true },
  { days: 14, label: '14-Day Streak', reward: '500 XP + 100 Coins', icon: Target, color: 'text-blue-400', achieved: currentStreak >= 14, claimed: false },
  { days: 30, label: '30-Day Streak', reward: '1000 XP + 300 Coins + Title', icon: Trophy, color: 'text-purple-400', achieved: currentStreak >= 30, claimed: false },
  { days: 60, label: '60-Day Streak', reward: '2000 XP + 500 Coins + Avatar', icon: Star, color: 'text-pink-400', achieved: currentStreak >= 60, claimed: false },
  { days: 100, label: '100-Day Streak', reward: '5000 XP + 1000 Coins + Legendary Badge', icon: Sparkles, color: 'text-red-400', achieved: currentStreak >= 100, claimed: false },
];

function generateCalendarDays() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push({
      date,
      day: date.getDate(),
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      active: i < currentStreak,
      isToday: i === 0,
      xp: i === 0 ? 50 : i < currentStreak ? [25, 50, 30, 40, 50, 35, 45][i % 7] : 0,
    });
  }
  return days;
}

const calendarDays = generateCalendarDays();
const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function StreaksPage() {
  return (
    <TooltipProvider>
      <Shell>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              LEARNING <span className="text-primary neon-text">STREAKS</span>
            </h1>
            <p className="text-muted-foreground">Track your daily coding consistency and earn milestone rewards.</p>
          </div>

          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-orange-500/10 via-primary/5 to-yellow-500/10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4" />
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <motion.div
                  className="relative"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Flame className="w-16 h-16 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-background rounded-full px-3 py-1 border border-orange-500/30">
                    <span className="text-xs font-bold text-orange-400">{currentStreak} days</span>
                  </div>
                </motion.div>
                <div className="text-center md:text-left space-y-2">
                  <h2 className="text-3xl font-headline font-bold">Current Streak</h2>
                  <p className="text-5xl font-headline font-black text-orange-400">{currentStreak} Days</p>
                  <p className="text-muted-foreground">Best streak: {longestStreak} days · Keep the momentum going!</p>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-orange-400/30 text-orange-400">
                      <Flame className="w-3 h-3 mr-1" /> On Fire!
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      <Zap className="w-3 h-3 mr-1" /> +50 XP today
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-sm font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="hidden md:flex items-center gap-2 mb-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {weekLabels.map(day => <span key={day} className="w-9 text-center">{day}</span>)}
              </div>
              <div className="grid grid-cols-[repeat(30,_minmax(0,_1fr))] gap-1">
                {calendarDays.map((day, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'aspect-square rounded-md flex items-center justify-center text-[9px] font-bold transition-all cursor-default',
                          day.isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                          day.active
                            ? 'bg-orange-500/30 text-orange-400 border border-orange-500/40'
                            : 'bg-muted/20 text-muted-foreground/40 border border-border/30',
                        )}
                      >
                        {day.day}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs space-y-1">
                      <p className="font-bold">{day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                      {day.active ? (
                        <p className="text-orange-400">Active · +{day.xp} XP earned</p>
                      ) : (
                        <p className="text-muted-foreground">Inactive</p>
                      )}
                      {day.isToday && <p className="text-primary">Today!</p>}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-sm font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Gift className="w-4 h-4 text-secondary" /> Milestone Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {milestones.map((milestone) => {
                  const Icon = milestone.icon;
                  const isUnlocked = milestone.achieved;
                  const isClaimed = milestone.claimed;
                  return (
                    <Card key={milestone.days} className={cn(
                      'border-border/50 transition-all',
                      isUnlocked && !isClaimed && 'border-primary/30 bg-primary/5',
                      isClaimed && 'border-emerald-500/30 bg-emerald-500/5',
                    )}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            isUnlocked ? 'bg-primary/10' : 'bg-muted/30',
                          )}>
                            <Icon className={cn('w-5 h-5', milestone.color)} />
                          </div>
                          {isClaimed ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[8px] uppercase tracking-widest">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Claimed
                            </Badge>
                          ) : isUnlocked ? (
                            <Badge variant="outline" className="text-[8px] uppercase tracking-widest text-primary border-primary/30">
                              Ready!
                            </Badge>
                          ) : (
                            <Lock className="w-4 h-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <h3 className="font-bold text-sm">{milestone.label}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{milestone.reward}</p>
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{Math.min(currentStreak, milestone.days)}/{milestone.days} days</span>
                          </div>
                          <Progress
                            value={Math.min(100, (currentStreak / milestone.days) * 100)}
                            className={cn(
                              'h-1.5',
                              isClaimed && 'bg-emerald-500/20',
                              isUnlocked && !isClaimed && 'bg-primary/20',
                            )}
                          />
                        </div>
                        {isUnlocked && !isClaimed && (
                          <Button size="sm" className="w-full mt-3 gap-1.5 text-xs">
                            <Gift className="w-3 h-3" /> Claim Reward
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-sm font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-muted-foreground" /> Tips to Maintain Your Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Start Small', description: 'Do just 1 problem or 1 lesson per day. Consistency beats intensity.' },
                  { title: 'Set a Reminder', description: 'Code at the same time every day. Build a habit, not just a streak.' },
                  { title: 'Use the App Daily', description: 'Even logging in for 2 minutes counts. Don\'t break the chain!' },
                  { title: 'Track Your Progress', description: 'Watch your streak grow. Each day adds to your motivation.' },
                  { title: 'Join Challenges', description: 'Participate in weekly challenges to stay engaged.' },
                  { title: 'Reward Yourself', description: 'Celebrate milestones. Treat yourself for achieving streak goals.' },
                ].map((tip, i) => (
                  <Card key={i} className="bg-muted/20 border-border/50">
                    <CardContent className="p-4">
                      <h4 className="font-bold text-sm">{tip.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Shell>
    </TooltipProvider>
  );
}
