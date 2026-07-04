'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  BarChart3, TrendingUp, Activity, Zap, Target, Flame, Loader2,
  ChartBar, GraduationCap, Gift, Brain, Swords, BookOpen, Code2,
  Medal, Star, HelpCircle, Trophy,
} from 'lucide-react';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useAppStore } from '@/store/app-store';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { WeeklyStats } from '@/components/analytics/WeeklyStats';
import { LearningRoadmap } from '@/components/learning/LearningRoadmap';
import { DailyLoginRewards } from '@/components/gamification/DailyLoginRewards';

const XP_PER_LEVEL = 500;

const metricInfo: Record<string, { what: string; how: string; why: string; improve: string }> = {
  level: {
    what: 'Your overall rank based on total XP earned.',
    how: 'Every 500 XP = 1 level up. Level = floor(XP / 500) + 1.',
    why: 'Levels show your dedication and experience. Higher levels unlock arena and advanced features.',
    improve: 'Complete lessons (+50–500 XP each), solve practice problems (+50 XP), and win arena matches (+100 XP).',
  },
  xp: {
    what: 'Experience points — the main measure of your progress.',
    how: 'Earned from lessons, practice problems, arena battles, and daily activity.',
    why: 'XP fuels your level progression and tracks overall engagement.',
    improve: 'Do daily lessons, solve practice problems, and participate in arena battles.',
  },
  elo: {
    what: 'Your competitive rating in the arena.',
    how: 'Starts at 1200. Win = gain ELO, lose = lose ELO. K-factor of 32.',
    why: 'ELO determines your tier (Beginner → Master) and matchmaking opponents.',
    improve: 'Win against higher-rated opponents for bigger ELO gains. Consistent practice improves your skills.',
  },
  winRate: {
    what: 'Percentage of arena matches you win.',
    how: 'Win Rate = Wins / (Wins + Losses) × 100. Draws are excluded.',
    why: 'Shows your competitive performance. A 50%+ rate means you win more than you lose.',
    improve: 'Practice coding problems, review match replays, and focus on accuracy over speed.',
  },
  streak: {
    what: 'Consecutive days you have used the app.',
    how: 'Visit the app daily. Miss a day = streak resets to 1.',
    why: 'Streaks build discipline and consistency — the #1 predictor of coding improvement.',
    improve: 'Log in every day, even for 5 minutes. Complete a quick lesson or practice problem.',
  },
  accuracy: {
    what: 'Percentage of coding submissions that pass all tests.',
    how: 'Accuracy = Correct Submissions / Total Submissions × 100.',
    why: 'Accuracy reflects code quality and problem-solving precision, not just speed.',
    improve: 'Read problems carefully, test your code mentally before submitting, and learn from wrong answers.',
  },
  coins: {
    what: 'In-app currency earned through achievements and activity.',
    how: 'Earned from completing lessons, winning arena matches, and achievements.',
    why: 'Coins can be used for cosmetics, rewards, and premium features.',
    improve: 'Complete lessons, win arena matches, and maintain your streak for bonus coins.',
  },
  lessonsCompleted: {
    what: 'Number of beginner programming lessons fully completed.',
    how: 'Each lesson requires: read content → pass quiz (60%+) → pass coding challenge.',
    why: 'Lessons build your foundation. All 16 lessons unlock the arena.',
    improve: 'Focus on understanding concepts, not just speed. Retake quizzes if needed.',
  },
  problemsSolved: {
    what: 'Practice problems you have solved correctly.',
    how: 'Solved when your code passes all test cases on a practice problem.',
    why: 'Problem-solving is the core skill of programming. More problems = stronger skills.',
    improve: 'Start with Easy problems, then Medium. Use hints when stuck, but try on your own first.',
  },
  tier: {
    what: 'Your rank title based on arena ELO rating.',
    how: 'Beginner (<800) → Learner (800–1199) → Intermediate (1200–1599) → Advanced (1600–1999) → Expert (2000–2399) → Master (2400+)',
    why: 'Tiers visually represent your competitive standing and unlock bragging rights.',
    improve: 'Climb the ELO ladder by winning arena matches against tougher opponents.',
  },
};

function MetricCard({ label, value, icon: Icon, color, infoKey, sub }: {
  label: string; value: string | number; icon: any; color: string; infoKey: string; sub?: string;
}) {
  const info = metricInfo[infoKey];
  return (
    <Card className="bg-card/50 border-border group hover:border-primary/30 transition-colors">
      <CardContent className="p-4 text-center space-y-2 relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="absolute top-2 right-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          {info && (
            <TooltipContent side="left" className="w-64 p-3 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">{label}</p>
              <div className="space-y-1.5 text-[11px]">
                <p><span className="font-semibold text-foreground">What:</span> {info.what}</p>
                <p><span className="font-semibold text-foreground">Calculation:</span> {info.how}</p>
                <p><span className="font-semibold text-foreground">Why it matters:</span> {info.why}</p>
                <p><span className="font-semibold text-foreground">How to improve:</span> {info.improve}</p>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
        <Icon className={cn('w-5 h-5 mx-auto', color)} />
        <div className={cn('text-2xl font-headline font-bold', color)}>{value}</div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        {sub && <div className="text-[9px] text-muted-foreground/60 -mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export default function ProgressPage() {
  const { user, loading: authLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc(user ? `users/${user.uid}` : null);
  const { state } = useAppStore();
  const { beginner, firebaseProgressLoaded } = state;

  if (authLoading || profileLoading || !firebaseProgressLoaded) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const totalXp = beginner.xp;
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXp % XP_PER_LEVEL;
  const xpPercent = Math.floor((xpInLevel / XP_PER_LEVEL) * 100);
  const nextLevelXp = XP_PER_LEVEL - xpInLevel;

  const arenaRating = profile?.rating ?? 1200;
  const arenaWins = profile?.wins ?? 0;
  const arenaLosses = profile?.losses ?? 0;
  const arenaDraws = profile?.draws ?? 0;
  const totalGames = arenaWins + arenaLosses + arenaDraws;
  const winRate = totalGames > 0 ? Math.round((arenaWins / (arenaWins + arenaLosses)) * 100) : 0;
  const tier = getTier(arenaRating);

  const totalSubmissions = beginner.totalSubmissions;
  const correctSubmissions = beginner.correctSubmissions;
  const accuracy = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

  const lessonsCount = beginner.lessonsCompleted.length;

  const metrics = [
    { label: 'Level', value: level, color: 'text-primary', icon: Zap, infoKey: 'level', sub: `${totalXp} total XP` },
    { label: 'XP to Next Level', value: nextLevelXp, color: 'text-muted-foreground', icon: Flame, infoKey: 'xp', sub: `${xpInLevel}/${XP_PER_LEVEL}` },
    { label: 'ELO Rating', value: arenaRating, color: 'text-secondary', icon: TrendingUp, infoKey: 'elo', sub: tier },
    { label: 'Win Rate', value: `${winRate}%`, color: 'text-emerald-400', icon: Activity, infoKey: 'winRate', sub: `${arenaWins}W / ${arenaLosses}L` },
    { label: 'Streak', value: beginner.streak, color: 'text-orange-400', icon: Target, infoKey: 'streak', sub: 'consecutive days' },
    { label: 'Accuracy', value: accuracy > 0 ? `${accuracy}%` : '—', color: 'text-cyan-400', icon: Brain, infoKey: 'accuracy', sub: `${correctSubmissions}/${totalSubmissions}` },
    { label: 'Coins', value: beginner.coins, color: 'text-yellow-400', icon: Star, infoKey: 'coins' },
    { label: 'Lessons Done', value: `${lessonsCount}/16`, color: 'text-blue-400', icon: BookOpen, infoKey: 'lessonsCompleted' },
    { label: 'Problems Solved', value: beginner.problemsSolved, color: 'text-purple-400', icon: Code2, infoKey: 'problemsSolved' },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold text-foreground">
            Progress
          </h1>
          <p className="text-muted-foreground">Track your coding journey across lessons, problems, and challenges.</p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-headline font-bold">{profile?.username || beginner.name || 'Player'}</h2>
                  <Badge variant="outline" className={cn('text-[11px] uppercase tracking-wider', getTierColor(tier))}>
                    <Trophy className="w-3 h-3 mr-1" /> {tier}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Level {level} · {arenaRating} ELO · {beginner.streak} day streak</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-headline font-bold text-emerald-400">{arenaWins}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-headline font-bold text-destructive">{arenaLosses}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-headline font-bold text-yellow-400">{arenaDraws}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Draws</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-headline font-bold text-blue-400">{lessonsCount}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Lessons</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-border md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Level Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Level {level}</span>
                <span className="text-sm text-muted-foreground">
                  {xpInLevel} / {XP_PER_LEVEL} XP
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${xpPercent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {nextLevelXp} XP needed for Level {level + 1}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Target className="w-5 h-5 text-secondary" /> Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${winRate}, ${100 - winRate}`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-headline font-bold text-primary">{winRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid grid-cols-3 gap-2 h-auto bg-muted/50 p-1">
            <TabsTrigger value="analytics" className="text-xs gap-1"><ChartBar className="w-3 h-3" /> Analytics</TabsTrigger>
            <TabsTrigger value="learning" className="text-xs gap-1"><GraduationCap className="w-3 h-3" /> Learning</TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs gap-1"><Gift className="w-3 h-3" /> Daily Rewards</TabsTrigger>
          </TabsList>
          <TabsContent value="analytics" className="mt-4">
            <AnalyticsDashboard
              weeklyCodingTime={profile?.weeklyCodingTime || 0}
              problemsSolvedByDifficulty={{ Easy: 0, Medium: 0, Hard: 0 }}
              winLossHistory={{ wins: arenaWins, losses: arenaLosses, draws: arenaDraws }}
              accuracy={accuracy}
              totalProblems={beginner.problemsSolved}
              totalCodingTime={profile?.totalCodingTime || 0}
              winRate={winRate}
            />
          </TabsContent>
          <TabsContent value="learning" className="mt-4">
            <LearningRoadmap goals={profile?.learningGoals || []} learningPath={profile?.learningPath || null} />
          </TabsContent>
          <TabsContent value="rewards" className="mt-4">
            <DailyLoginRewards userId={user?.uid || null} />
          </TabsContent>
        </Tabs>

        <WeeklyStats summary={profile?.weeklySummary || null} />
      </div>
    </TooltipProvider>
  );
}
