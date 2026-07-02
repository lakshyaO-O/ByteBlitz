'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Zap, Target, Flame, Trophy, BookOpen, Code2, Sparkles, GraduationCap,
  ArrowRight, CheckCircle2, Star, Gift, Clock, TrendingUp, Medal, Swords,
  Lightbulb, PartyPopper, Coins, Rocket, Brain, Heart, Quote, ChevronRight,
  Briefcase, MessageCircle, Bug, Map, FileText, Globe, Users2,
  Share2, Store, FolderGit2, Newspaper, CalendarDays, Sparkles as SparklesIcon,
} from 'lucide-react';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore } from '@/firebase/provider';
import { useAppStore, BeginnerState } from '@/store/app-store';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { CompleteRoadmap } from '@/components/learning/CompleteRoadmap';
import type { LessonData } from '@/data/lessons';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { celebrate } from '@/components/gamification/CelebrationOverlay';

const dailyMotivations = [
  '"Every expert was once a beginner." — Keep going!',
  '"The best time to start was yesterday. The next best time is now."',
  '"Code is like humor. When you have to explain it, it\'s bad."',
  '"Programming isn\'t about what you know; it\'s about what you can figure out."',
  '"Your code will work. Just don\'t give up."',
  '"Mistakes are proof that you are trying."',
  '"The computer was born to solve problems that did not exist before."',
  '"First, solve the problem. Then, write the code."',
];

const dailyChallenges = [
  { title: 'Print your name', desc: 'Write code to display your name on screen', xp: 25 },
  { title: 'Store your age', desc: 'Create a variable with your age and print it', xp: 30 },
  { title: 'Say hello', desc: 'Ask for a name and say hello to them', xp: 35 },
  { title: 'Even or odd', desc: 'Check if a number is even or odd', xp: 40 },
  { title: 'Count to 10', desc: 'Use a loop to count from 1 to 10', xp: 45 },
];

export default function BeginnerDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { state, incrementStreak } = useAppStore();
  const { beginner, firebaseProgressLoaded } = state;

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [motivation] = useState(() => dailyMotivations[Math.floor(Math.random() * dailyMotivations.length)]);
  const [dailyChallenge] = useState(() => dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)]);

  useEffect(() => {
    if (firebaseProgressLoaded) {
      setShowOnboarding(!beginner.hasCompletedOnboarding);
    }
  }, [firebaseProgressLoaded, beginner.hasCompletedOnboarding]);

  useEffect(() => {
    if (firebaseProgressLoaded && user) {
      incrementStreak();
    }
  }, [firebaseProgressLoaded, user]);

  const userProfileQuery = user && db ? `users/${user.uid}` : null;
  const { data: profile } = useDoc(userProfileQuery);

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    celebrate({
      type: 'first_program',
      title: 'Welcome to DevRann! 🎉',
      message: 'Your coding journey begins now. Let\'s write your first line of code!',
      icon: Rocket,
      color: 'text-primary',
      xpGained: 50,
    });
  };

  const handleStartLesson = (lesson: LessonData) => {
    window.location.href = '/learning';
  };

  if (authLoading || !firebaseProgressLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">{authLoading ? 'Loading your journey...' : 'Preparing your dashboard...'}</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleCompleteOnboarding} />;
  }

  const completedCount = beginner.lessonsCompleted.length;
  const totalLessons = 16;
  const roadmapProgress = Math.round((completedCount / totalLessons) * 100);
  const xpProgress = beginner.xp > 0 ? Math.min(100, (beginner.xp % 500) / 5) : 0;
  const currentLevel = Math.floor(beginner.xp / 500) + 1;

  return (
    <ErrorBoundary>
      <Shell>
        <div className="space-y-6 pb-12">
          {/* Welcome Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-secondary/10 border border-primary/20 p-6 md:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">
                      Level {currentLevel}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400 bg-yellow-500/5">
                      <Flame className="w-3 h-3 mr-1" /> {beginner.streak} day streak
                    </Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-headline font-bold">
                    {beginner.name ? `Hey ${beginner.name}! 👋` : 'Hey there! 👋'}
                  </h1>
                  <p className="text-muted-foreground mt-1 max-w-lg">
                    {beginner.isBeginnerMode
                      ? 'Ready to learn coding? You\'ve got this! Every expert was once a beginner.'
                      : 'Keep building your skills! You\'re making great progress.'}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Today's XP</p>
                    <p className="text-xl font-headline font-bold text-primary">{beginner.dailyXpEarned} <span className="text-xs text-muted-foreground">/ {beginner.dailyXpGoal}</span></p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              {/* Daily XP Progress */}
              <div className="mt-4 max-w-xs">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Daily Goal Progress</span>
                  <span>{Math.min(100, Math.round((beginner.dailyXpEarned / beginner.dailyXpGoal) * 100))}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, (beginner.dailyXpEarned / beginner.dailyXpGoal) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickActionCard
              icon={BookOpen}
              label="Continue Learning"
              sub="Resume your lesson"
              color="from-blue-400 to-cyan-400"
              onClick={() => window.location.href = '/learning'}
            />
            <QuickActionCard
              icon={Code2}
              label="Quick Practice"
              sub="Try a coding challenge"
              color="from-green-400 to-emerald-400"
              onClick={() => window.location.href = '/practice'}
            />
            <QuickActionCard
              icon={GraduationCap}
              label="Learning Roadmap"
              sub="See your progress"
              color="from-purple-400 to-pink-400"
              onClick={() => window.location.href = '/learning'}
            />
            <QuickActionCard
              icon={Swords}
              label={completedCount >= 15 ? 'Enter Arena' : 'Arena (Locked)'}
              sub={completedCount >= 15 ? 'Battle others!' : `Complete ${15 - completedCount} more lessons`}
              color={completedCount >= 15 ? 'from-yellow-400 to-amber-600' : 'from-gray-500 to-gray-600'}
              onClick={() => completedCount >= 15 ? window.location.href = '/arena' : null}
              locked={completedCount < 15}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Lesson */}
              <Card className="bg-card/50 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      {completedCount >= totalLessons ? (
                        <Trophy className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <Target className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {completedCount >= totalLessons ? 'Completed!' : 'Current Lesson'}
                      </p>
                      <h3 className="text-lg font-headline font-bold mt-1">
                        {completedCount >= totalLessons
                          ? 'All Lessons Complete!'
                          : `Lesson ${beginner.currentLesson}: ${getLessonTitle(beginner.currentLesson)}`}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {completedCount >= totalLessons
                          ? 'Congratulations! You\'ve completed the beginner roadmap. Enter the Arena!'
                          : getLessonDescription(beginner.currentLesson)}
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                        <Button
                          onClick={() => window.location.href = '/learning'}
                          className="gap-1"
                        >
                          {completedCount >= totalLessons ? 'Go to Arena' : 'Continue Lesson'}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Zap className="w-3 h-3 text-primary" /> {getLessonXp(beginner.currentLesson)} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Roadmap Preview */}
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Your Progress
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => window.location.href = '/learning'}>
                      View Full Roadmap <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Roadmap Progress</span>
                      <span className="font-bold">{completedCount}/{totalLessons} lessons</span>
                    </div>
                    <Progress value={roadmapProgress} className="h-2.5" />

                    {/* Quick topic badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {['Output', 'Variables', 'Input', 'Operators', 'Conditions', 'Loops', 'Functions', 'Arrays'].map((topic, i) => (
                        <Badge
                          key={topic}
                          variant={i < completedCount ? 'default' : 'outline'}
                          className={cn(
                            'text-[9px] uppercase tracking-widest',
                            i < completedCount ? 'bg-primary/20 text-primary border-primary/30' : 'text-muted-foreground'
                          )}
                        >
                          {i < completedCount ? <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> : null}
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Challenge */}
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" /> Daily Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                      <Code2 className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{dailyChallenge.title}</h4>
                      <p className="text-xs text-muted-foreground">{dailyChallenge.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-primary font-bold text-sm">+{dailyChallenge.xp} XP</p>
                      <Button variant="outline" size="sm" className="mt-1 text-xs gap-1"
                        onClick={() => window.location.href = '/practice'}>
                        Try <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Stats Card */}
              <Card className="bg-card/50 border-border">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border border-primary/30">
                      <AvatarImage src={user?.photoURL || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {(beginner.name || user?.displayName || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{beginner.name || user?.displayName || 'Coder'}</p>
                      <p className="text-[10px] text-muted-foreground">Level {currentLevel} Learner</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">XP</span>
                      <span className="font-bold">{beginner.xp} / {currentLevel * 500}</span>
                    </div>
                    <Progress value={xpProgress} className="h-1.5" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/30">
                      <Flame className={cn('w-4 h-4 mx-auto mb-1', beginner.streak >= 3 ? 'text-orange-400' : 'text-muted-foreground')} />
                      <p className="text-lg font-headline font-bold">{beginner.streak}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Day Streak</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <Star className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
                      <p className="text-lg font-headline font-bold">{beginner.coins}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Coins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Motivation */}
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      {motivation}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements Preview */}
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-headline font-bold flex items-center gap-2">
                    <Medal className="w-3.5 h-3.5 text-yellow-400" /> Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-3 gap-2">
                    <AchievementBadgeSmall
                      achieved={completedCount >= 1}
                      label="First Lesson"
                      icon={BookOpen}
                    />
                    <AchievementBadgeSmall
                      achieved={completedCount >= 5}
                      label="Getting Started"
                      icon={Star}
                    />
                    <AchievementBadgeSmall
                      achieved={completedCount >= 10}
                      label="Half Way!"
                      icon={Trophy}
                    />
                    <AchievementBadgeSmall
                      achieved={beginner.streak >= 3}
                      label="On Fire"
                      icon={Flame}
                    />
                    <AchievementBadgeSmall
                      achieved={beginner.xp >= 100}
                      label="100 XP"
                      icon={Zap}
                    />
                    <AchievementBadgeSmall
                      achieved={completedCount >= 16}
                      label="Arena Ready"
                      icon={Swords}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Ecosystem Quick Links */}
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-headline font-bold flex items-center gap-2">
                    <Rocket className="w-3.5 h-3.5 text-primary" /> Ecosystem
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  <EcoLink href="/ai-mentor" icon={SparklesIcon} label="AI Mentor" />
                  <EcoLink href="/community" icon={MessageCircle} label="Community" />
                  <EcoLink href="/career-hub" icon={Briefcase} label="Career Hub" />
                  <EcoLink href="/hackathons" icon={Rocket} label="Hackathons" />
                  <EcoLink href="/missions" icon={Lightbulb} label="Daily Missions" />
                  <EcoLink href="/shop" icon={Store} label="Rewards Shop" />
                  <EcoLink href="/projects" icon={FolderGit2} label="Project Showcase" />
                </CardContent>
              </Card>

              {/* Recommended Next */}
              <Button
                variant="outline"
                className="w-full gap-2 h-12 border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => window.location.href = '/learning'}
              >
                <Rocket className="w-4 h-4" />
                View Full Learning Roadmap
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Shell>
    </ErrorBoundary>
  );
}

function QuickActionCard({ icon: Icon, label, sub, color, onClick, locked }: {
  icon: any; label: string; sub: string; color: string; onClick?: () => void; locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={cn(
        'p-4 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 transition-all text-left group',
        locked && 'opacity-60 cursor-not-allowed'
      )}
    >
      <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3 group-hover:scale-110 transition-transform', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="font-bold text-sm">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </button>
  );
}

function AchievementBadgeSmall({ achieved, label, icon: Icon }: { achieved: boolean; label: string; icon: any }) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-1 p-2 rounded-lg text-center',
      achieved ? 'bg-primary/5 border border-primary/20' : 'opacity-40'
    )}>
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', achieved ? 'bg-primary/20' : 'bg-muted')}>
        <Icon className={cn('w-4 h-4', achieved ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      <span className="text-[8px] font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

function EcoLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all group"
    >
      <Icon className="w-3.5 h-3.5 shrink-0 text-primary/70 group-hover:text-primary" />
      <span>{label}</span>
      <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function getLessonTitle(id: number): string {
  const titles: Record<number, string> = {
    1: 'Introduction to Programming',
    2: 'Printing Output',
    3: 'Variables',
    4: 'Taking Input',
    5: 'Operators',
    6: 'Conditions',
    7: 'Loops',
    8: 'Functions',
    9: 'Arrays / Lists',
    10: 'Strings',
    11: '2D Arrays',
    12: 'Searching',
    13: 'Sorting',
    14: 'Recursion',
    15: 'Basic DSA',
    16: 'Arena Unlocked!',
  };
  return titles[id] || 'Unknown Lesson';
}

function getLessonDescription(id: number): string {
  const descs: Record<number, string> = {
    1: 'Learn what programming is and how computers think.',
    2: 'Write your first code — make the computer display messages!',
    3: 'Store information using labeled boxes called variables.',
    4: 'Make your programs interactive by taking user input.',
    5: 'Do math and comparisons in your code.',
    6: 'Teach your program to make decisions with if/else.',
    7: 'Repeat tasks without writing the same code twice.',
    8: 'Create your own reusable commands.',
    9: 'Store multiple items in one place using lists.',
    10: 'Master text manipulation and string methods.',
    11: 'Work with grids and tables of data.',
    12: 'Find items in lists efficiently.',
    13: 'Arrange data in order with sorting algorithms.',
    14: 'Functions that call themselves — mind-bending but powerful!',
    15: 'A gentle intro to data structures and algorithms.',
    16: 'Enter the Arena and test your skills against others!',
  };
  return descs[id] || 'Continue your learning journey.';
}

function getLessonXp(id: number): number {
  const xp: Record<number, number> = { 1: 50, 2: 50, 3: 75, 4: 75, 5: 75, 6: 100, 7: 100, 8: 100, 9: 100, 10: 100, 11: 125, 12: 125, 13: 125, 14: 150, 15: 200, 16: 500 };
  return xp[id] || 50;
}
