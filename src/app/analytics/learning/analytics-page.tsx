'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain, TrendingUp, TrendingDown, Target, Zap, BookOpen, Sparkles,
  BarChart3, ChevronRight, Flame, Award, Star, Lightbulb,
  CheckCircle2, XCircle, Trophy, Activity, Layers, Code2, Hash,
  AlertTriangle, GraduationCap, Rocket, Swords, Gem,
  Calendar, ScrollText, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { usePracticeProblems, useUserProgress } from '@/hooks/use-practice-problems';
import { usePracticeStats } from '@/hooks/use-practice-stats';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PATTERNS } from '@/data/patterns';

function AnimatedCounter({ value, suffix = '', prefix = '', decimals = 0 }: { value: number; suffix?: string; prefix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    startTime.current = performance.now();
    ref.current = requestAnimationFrame(function animate(now) {
      const elapsed = now - startTime.current;
      const duration = 800;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value * Math.pow(10, decimals)) / Math.pow(10, decimals));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    });
    return () => cancelAnimationFrame(ref.current);
  }, [value, decimals]);

  return <>{prefix}{display.toFixed(decimals)}{suffix}</>;
}

function ProgressRing({ percent, size = 100, strokeWidth = 6, color = 'hsl(217, 76%, 52%)', label }: { percent: number; size?: number; strokeWidth?: number; color?: string; label?: string }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-lg font-bold font-mono tabular-nums"><AnimatedCounter value={percent} suffix="%" /></span>
        {label && <span className="text-[8px] text-muted-foreground mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

function Sparkline({ data, height = 24, width = 64, color = 'hsl(217, 76%, 52%)' }: { data: number[]; height?: number; width?: number; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <motion.polyline
        points={points}
        fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
    </svg>
  );
}

function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

const colorMap: Record<string, { text: string; bg: string; glow: string; hsl: string }> = {
  primary: { text: 'text-primary', bg: 'bg-primary/10', glow: 'hsl(217, 76%, 52%)', hsl: 'hsl(var(--primary))' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'hsl(142, 76%, 42%)', hsl: 'hsl(142, 76%, 42%)' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'hsl(38, 92%, 50%)', hsl: 'hsl(38, 92%, 50%)' },
  red: { text: 'text-red-400', bg: 'bg-red-500/10', glow: 'hsl(0, 78%, 56%)', hsl: 'hsl(0, 78%, 56%)' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', glow: 'hsl(270, 76%, 52%)', hsl: 'hsl(270, 76%, 52%)' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'hsl(270, 76%, 52%)', hsl: 'hsl(270, 76%, 52%)' },
  orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', glow: 'hsl(30, 90%, 50%)', hsl: 'hsl(30, 90%, 50%)' },
  yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', glow: 'hsl(50, 90%, 50%)', hsl: 'hsl(50, 90%, 50%)' },
};

function StatCard({
  icon: Icon, label, value, suffix = '', prefix = '', trend, trendLabel, color = 'primary', sparklineData,
}: {
  icon: React.ElementType; label: string; value: number; suffix?: string; prefix?: string;
  trend?: 'up' | 'down' | 'stable'; trendLabel?: string; color?: string; sparklineData?: number[];
}) {
  const c = colorMap[color] || colorMap.primary;
  return (
    <GlowCard className="p-4 relative overflow-hidden group">
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Icon className={cn('w-4 h-4', c.text)} />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums tracking-tight">
            <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />
          </div>
          {(trend || trendLabel) && (
            <div className="flex items-center gap-1">
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
              {trend === 'stable' && <Activity className="w-3 h-3 text-muted-foreground" />}
              {trendLabel && <span className="text-[9px] text-muted-foreground">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {sparklineData && sparklineData.length > 0 && (
            <Sparkline data={sparklineData} color={c.glow} />
          )}
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3', c.bg)}>
            <Icon className={cn('w-4 h-4', c.text)} />
          </div>
        </div>
      </div>
    </GlowCard>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  if (isNaN(d)) return '';
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function getDifficultyColor(d: string) {
  switch (d) {
    case 'Easy': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    case 'Medium': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    case 'Hard': return 'text-red-400 border-red-500/30 bg-red-500/10';
    default: return 'text-muted-foreground border-border/50 bg-muted/50';
  }
}

function calculateLevel(xp: number): { level: number; currentXp: number; nextXp: number } {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentXp = xp;
  const nextXp = level * level * 100;
  return { level, currentXp, nextXp };
}

export function LearningAnalyticsPage() {
  const { user } = useUser();
  const { problems } = usePracticeProblems();
  const { progress } = useUserProgress(user?.uid || null);
  const { stats, loading, achievements, solvedByDifficulty, totalSolved, accuracy } = usePracticeStats(user?.uid || null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  const topicData = useMemo(() => {
    if (!problems || !progress || !stats) return [];
    const counts = problems.reduce((acc, p) => {
      (p.topics || []).forEach(t => {
        if (!acc[t]) acc[t] = { total: 0, solved: 0, attempted: 0 };
        acc[t].total++;
        if (progress[p.id]?.solved) acc[t].solved++;
        if (progress[p.id]?.attempted) acc[t].attempted++;
      });
      return acc;
    }, {} as Record<string, { total: number; solved: number; attempted: number }>);

    return Object.entries(counts)
      .map(([topic, data]) => ({
        topic,
        ...data,
        mastery: data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.mastery - a.mastery);
  }, [problems, progress, stats]);

  const strongTopics = topicData.filter(t => t.mastery >= 70);
  const weakTopics = topicData.filter(t => t.mastery < 40 && t.total > 0);
  const mediumTopics = topicData.filter(t => t.mastery >= 40 && t.mastery < 70);

  const patternsMastered = useMemo(() => {
    if (!problems || !progress) return [];
    return Object.entries(PATTERNS)
      .filter(([, p]) => {
        const relatedProblems = problems.filter(pr =>
          (pr.topics || []).some(t => p.detectionRules.some(r => r.toLowerCase().includes(t.toLowerCase())))
        );
        return relatedProblems.some(pr => progress[pr.id]?.solved);
      })
      .slice(0, 5)
      .map(([, p]) => p.name);
  }, [problems, progress]);

  const weakTopicNames = weakTopics.map(t => t.topic);

  const recommendations = useMemo(() => {
    if (!problems || weakTopicNames.length === 0) return [];
    const unsolved = problems.filter(p =>
      !progress?.[p.id]?.solved &&
      (p.topics || []).some(t => weakTopicNames.includes(t))
    );
    return unsolved.slice(0, 5);
  }, [problems, weakTopicNames, progress]);

  const totalAttemptedAll = stats?.totalAttempted || 0;
  const currentStreak = stats?.currentStreak || 0;
  const longestStreak = stats?.longestStreak || 0;
  const totalXp = stats?.totalXpEarned || 0;
  const totalCoins = stats?.totalCoinsEarned || 0;
  const totalProblems = problems?.length || 0;
  const topicsCount = topicData.length;
  const improvementData = stats?.improvement?.map(d => d.accuracy) || [];
  const recentSubmissions = stats?.recentSubmissions || [];

  const hasData = totalSolved > 0 || totalAttemptedAll > 0;

  const xpInfo = calculateLevel(totalXp);

  const submissionsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    (stats?.submissions || []).forEach(s => {
      try {
        const d = new Date(s.submittedAt).toISOString().slice(0, 10);
        if (d) map[d] = (map[d] || 0) + 1;
      } catch { /* */ }
    });
    return map;
  }, [stats]);

  const aiInsights = useMemo(() => {
    if (!hasData) return [];
    const insights: Array<{ icon: React.ElementType; text: string; color: string }> = [];

    if (accuracy >= 80) insights.push({ icon: Star, text: `Excellent accuracy (${accuracy}%)! You're solving problems correctly.`, color: 'text-amber-400' });
    else if (accuracy >= 60) insights.push({ icon: Target, text: `Good accuracy (${accuracy}%). Try reviewing failed cases to improve further.`, color: 'text-emerald-400' });
    else if (accuracy > 0) insights.push({ icon: AlertTriangle, text: `Your accuracy is ${accuracy}%. Focus on understanding before coding.`, color: 'text-red-400' });

    if (currentStreak >= 7) insights.push({ icon: Flame, text: `Incredible ${currentStreak}-day streak! Your consistency is outstanding.`, color: 'text-orange-400' });
    else if (currentStreak >= 3) insights.push({ icon: Flame, text: `${currentStreak}-day streak! You're building great momentum.`, color: 'text-orange-400' });
    else if (currentStreak > 0) insights.push({ icon: Zap, text: `You've started a ${currentStreak}-day streak. Keep it going!`, color: 'text-yellow-400' });

    if (solvedByDifficulty.Hard > 0) insights.push({ icon: Swords, text: `You've conquered ${solvedByDifficulty.Hard} Hard problems. Ready for more challenges.`, color: 'text-red-400' });
    if (solvedByDifficulty.Medium > solvedByDifficulty.Easy && solvedByDifficulty.Medium > 5) insights.push({ icon: TrendingUp, text: `You're tackling more Medium problems. That's great progression!`, color: 'text-purple-400' });

    if (weakTopics.length > 0) {
      const weakest = [...weakTopics].sort((a, b) => a.mastery - b.mastery)[0];
      insights.push({ icon: Lightbulb, text: `Focus on ${weakest.topic} (${weakest.mastery}% mastery). Try ${weakest.total - weakest.solved} remaining problems.`, color: 'text-blue-400' });
    }

    if (strongTopics.length >= 3) insights.push({ icon: Award, text: `You've mastered ${strongTopics.length} topics! Time to tackle harder concepts.`, color: 'text-emerald-400' });

    if (insights.length === 0) insights.push({ icon: Brain, text: 'Keep practicing to unlock personalized AI insights about your learning patterns.', color: 'text-violet-400' });

    return insights;
  }, [hasData, accuracy, currentStreak, solvedByDifficulty, weakTopics, strongTopics.length]);

  const learningMilestones = useMemo(() => {
    const milestones: Array<{ date: string; title: string; icon: React.ElementType; color: string }> = [];
    if (!hasData) return milestones;

    const firstSolve = recentSubmissions.length > 0
      ? [...recentSubmissions].reverse().find(s => s.verdict === 'Accepted')
      : null;

    if (firstSolve && firstSolve.submittedAt) {
      const d = new Date(firstSolve.submittedAt);
      const dateStr = isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString();
      milestones.push({
        date: dateStr,
        title: 'Solved first problem',
        icon: CheckCircle2, color: 'text-emerald-400',
      });
    }

    if (totalSolved >= 10) {
      milestones.push({
        date: 'Milestone',
        title: 'Solved 10 problems',
        icon: Star, color: 'text-amber-400',
      });
    }
    if (totalSolved >= 50) {
      milestones.push({
        date: 'Milestone',
        title: 'Solved 50 problems',
        icon: Award, color: 'text-purple-400',
      });
    }
    if (currentStreak >= 7) {
      milestones.push({
        date: 'Streak',
        title: `${currentStreak}-day streak achieved`,
        icon: Flame, color: 'text-orange-400',
      });
    }
    if (strongTopics.length >= 3) {
      milestones.push({
        date: 'Mastery',
        title: `Mastered ${strongTopics.length} topics`,
        icon: GraduationCap, color: 'text-blue-400',
      });
    }
    if (solvedByDifficulty.Hard > 0) {
      milestones.push({
        date: 'Challenge',
        title: 'Solved first Hard problem',
        icon: Swords, color: 'text-red-400',
      });
    }

    return milestones;
  }, [hasData, recentSubmissions, totalSolved, currentStreak, strongTopics.length, solvedByDifficulty.Hard]);

  const hasNewAchievements = achievements.length > 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayActivity = submissionsByDay[today] || 0;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading your analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-full blur-3xl" />
            <div className="relative w-32 h-32 rounded-full bg-card border border-border/60 flex items-center justify-center">
              <Brain className="w-14 h-14 text-primary/60" />
            </div>
          </div>
          <div className="space-y-3 max-w-md">
            <h2 className="text-2xl font-bold">Your Learning Journey Starts Here</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your analytics will appear after solving your first practice problem.
              Start coding to unlock insights about your strengths, weaknesses, and progress.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/practice">
                <Code2 className="w-4 h-4" />
                Solve Your First Problem
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/learning">
                <BookOpen className="w-4 h-4" />
                Start Learning
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-2xl">
            {[
              { icon: Target, title: 'Track Progress', desc: 'Monitor your topic mastery and skill growth over time' },
              { icon: Lightbulb, title: 'AI Insights', desc: 'Get personalized recommendations based on your performance' },
              { icon: Trophy, title: 'Earn Achievements', desc: 'Unlock badges and milestones as you improve' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-4 rounded-xl border border-border/40 bg-card/40 text-center space-y-2"
              >
                <item.icon className="w-6 h-6 text-primary/60 mx-auto" />
                <h4 className="text-sm font-semibold">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ========== HERO ========== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 via-card/50 to-card/30 p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-shrink-0">
            <ProgressRing
              percent={accuracy}
              size={110}
              strokeWidth={7}
              color={accuracy >= 70 ? 'hsl(142, 76%, 42%)' : accuracy >= 40 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 78%, 56%)'}
              label="Accuracy"
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Learning Analytics</h1>
              <Badge variant="ai" className="text-[10px] px-2 py-0.5">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">Level {xpInfo.level}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-medium">{currentStreak} day streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium">{totalSolved} solved</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 justify-center md:justify-start text-xs text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground"><AnimatedCounter value={totalXp} /> XP</span> earned
              </div>
              <div>
                <span className="font-semibold text-foreground">{topicData.length}</span> topics
              </div>
              <div>
                <span className="font-semibold text-foreground"><AnimatedCounter value={totalAttemptedAll} /></span> total attempts
              </div>
              <div>
                <span className="font-semibold text-foreground">{todayActivity > 0 ? `${todayActivity} today` : 'No activity today'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 justify-center md:justify-start">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs text-muted-foreground italic">
                {accuracy >= 80
                  ? "You're on fire! Keep pushing your limits."
                  : accuracy >= 50
                    ? "Consistent practice is the key to mastery. Keep going!"
                    : "Every expert was once a beginner. Stay curious and keep coding."}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-lg font-bold font-mono tabular-nums"><AnimatedCounter value={totalSolved} /></p>
            <p className="text-[10px] text-muted-foreground">Problems Solved</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-lg font-bold font-mono tabular-nums"><AnimatedCounter value={accuracy} suffix="%" /></p>
            <p className="text-[10px] text-muted-foreground">Accuracy</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-lg font-bold font-mono tabular-nums"><AnimatedCounter value={totalXp} /></p>
            <p className="text-[10px] text-muted-foreground">Total XP</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-lg font-bold font-mono tabular-nums"><AnimatedCounter value={currentStreak} /></p>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </div>
        </div>

        <div className="relative z-10 mt-4">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(xpInfo.currentXp / xpInfo.nextXp) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
            <span>Level {xpInfo.level}</span>
            <span>{xpInfo.currentXp} / {xpInfo.nextXp} XP to Level {xpInfo.level + 1}</span>
          </div>
        </div>
      </motion.div>

      {/* ========== PERFORMANCE OVERVIEW ========== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Performance Overview</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard icon={Brain} label="Problems Solved" value={totalSolved} color="primary" sparklineData={improvementData.length > 0 ? improvementData : undefined}
            trend={improvementData.length >= 2 ? (improvementData[improvementData.length - 1] >= improvementData[0] ? 'up' : 'down') : undefined} />
          <StatCard icon={Target} label="Accuracy" value={accuracy} suffix="%" color="emerald"
            trend={accuracy >= 70 ? 'up' : accuracy >= 40 ? 'stable' : 'down'} trendLabel={accuracy >= 70 ? 'Great' : accuracy >= 40 ? 'Steady' : 'Needs work'} />
          <StatCard icon={BookOpen} label="Topics Practiced" value={topicsCount} color="violet" />
          <StatCard icon={Zap} label="Current Streak" value={currentStreak} suffix=" days" color="amber"
            trend={currentStreak >= 7 ? 'up' : currentStreak >= 3 ? 'stable' : currentStreak > 0 ? 'up' : undefined}
            trendLabel={currentStreak >= 7 ? 'On fire!' : currentStreak >= 3 ? 'Building' : currentStreak > 0 ? 'Started' : undefined} />
          <StatCard icon={Flame} label="Longest Streak" value={longestStreak} suffix=" days" color="orange" />
          <StatCard icon={Award} label="Patterns Mastered" value={patternsMastered.length} color="purple" />
          <StatCard icon={Layers} label="Difficulty" value={solvedByDifficulty.Hard} suffix=" hard" color="red"
            trend={solvedByDifficulty.Hard > 0 ? 'up' : undefined} trendLabel={solvedByDifficulty.Hard > 0 ? 'Challenger' : undefined} />
          <StatCard icon={Gem} label="Total XP" value={totalXp} color="amber" />
        </div>
      </div>

      {/* ========== DIFFICULTY BREAKDOWN + TOPIC OVERVIEW ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlowCard className="p-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Difficulty Breakdown</h3>
          </div>
          <div className="space-y-3">
            {(['Easy', 'Medium', 'Hard'] as const).map(diff => {
              const count = solvedByDifficulty[diff];
              const maxCount = Math.max(solvedByDifficulty.Easy, solvedByDifficulty.Medium, solvedByDifficulty.Hard, 1);
              const pct = totalSolved > 0 ? (count / totalSolved) * 100 : 0;
              return (
                <div key={diff} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn('font-medium', diff === 'Easy' ? 'text-emerald-400' : diff === 'Medium' ? 'text-amber-400' : 'text-red-400')}>
                      {diff}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-foreground">{count}</span>
                      <span className="text-muted-foreground">({Math.round(pct)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', diff === 'Easy' ? 'bg-emerald-500' : diff === 'Medium' ? 'bg-amber-500' : 'bg-red-500')}
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxCount) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlowCard>

        <GlowCard className="p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Topic Distribution</h3>
          </div>
          {topicData.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topicData.map(t => (
                <div
                  key={t.topic}
                  className="relative group"
                  onMouseEnter={() => setHoveredTopic(t.topic)}
                  onMouseLeave={() => setHoveredTopic(null)}
                >
                  <div className={cn(
                    'px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-200 cursor-default',
                    t.mastery >= 70
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      : t.mastery >= 40
                        ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                        : 'border-red-500/20 bg-red-500/10 text-red-400'
                  )}>
                    {t.topic}
                    <span className="ml-1.5 opacity-60">{t.mastery}%</span>
                  </div>
                  <AnimatePresence>
                    {hoveredTopic === t.topic && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-popover border border-border shadow-lg z-20 whitespace-nowrap"
                      >
                        <p className="text-[10px] text-muted-foreground">{t.solved}/{t.total} solved</p>
                        <div className="h-1 w-full bg-muted rounded-full mt-1 overflow-hidden">
                          <div className={cn(
                            'h-full rounded-full',
                            t.mastery >= 70 ? 'bg-emerald-500' : t.mastery >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          )} style={{ width: `${t.mastery}%` }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No topic data yet</p>
          )}
        </GlowCard>
      </div>

      {/* ========== AI INSIGHTS ========== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold">AI Coach Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {aiInsights.map((insight, i) => (
            <motion.div
              key={i}
              variants={itemVariants} initial="hidden" animate="show" transition={{ delay: i * 0.05, duration: 0.35, ease: 'easeOut' }}
              className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-card/80 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                <insight.icon className={cn('w-4 h-4', insight.color)} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ========== TOPIC MASTERY & WEAKNESSES ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlowCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Strong Topics</h3>
            <Badge variant="success" className="ml-auto text-[9px] px-1.5 py-0">{strongTopics.length}</Badge>
          </div>
          {strongTopics.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Target className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-[11px] text-muted-foreground/60">Solve more problems to build your strengths.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {strongTopics.map(t => (
                <motion.div
                  key={t.topic}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group relative p-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{t.topic}</span>
                      <Badge variant="success" className="text-[8px] px-1 py-0 h-4">Mastered</Badge>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-emerald-400 font-bold">{t.mastery}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${t.mastery}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px] text-muted-foreground">{t.solved}/{t.total} solved</span>
                    <span className="text-[9px] text-emerald-400/60">Last practiced recently</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlowCard>

        <GlowCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Needs Practice</h3>
            <Badge variant="destructive" className="ml-auto text-[9px] px-1.5 py-0">{weakTopics.length}</Badge>
          </div>
          {weakTopics.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto" />
              <p className="text-[11px] text-muted-foreground/60">Great job! No weak topics detected.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {weakTopics.map(t => (
                <Link
                  href={`/practice?topic=${encodeURIComponent(t.topic)}`}
                  key={t.topic}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group relative p-3 rounded-xl border border-red-500/10 bg-red-500/[0.03] hover:bg-red-500/[0.06] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{t.topic}</span>
                        <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">{t.total - t.solved} left</Badge>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-red-400 font-bold">{t.mastery}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${t.mastery}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[9px] text-muted-foreground">{t.solved}/{t.total} solved</span>
                      <span className="text-[9px] text-blue-400/60 flex items-center gap-1">
                        <Lightbulb className="w-2.5 h-2.5" />
                        Practice more
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </GlowCard>
      </div>

      {/* ========== ALL TOPICS (medium) ========== */}
      {mediumTopics.length > 0 && (
        <GlowCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">In Progress</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mediumTopics.map(t => (
              <div key={t.topic} className="flex items-center justify-between px-3 py-2 rounded-lg border border-amber-500/10 bg-amber-500/[0.03]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-foreground">{t.topic}</span>
                  <span className="text-[9px] text-muted-foreground">{t.solved}/{t.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${t.mastery}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-amber-400 w-8 text-right">{t.mastery}%</span>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* ========== RECOMMENDATIONS + PATTERNS ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {recommendations.length > 0 && (
          <GlowCard className="p-4 lg:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Recommended Practice</h3>
            </div>
            <div className="space-y-1.5">
              {recommendations.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/practice?problem=${p.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-medium text-foreground group-hover:text-primary transition-colors truncate">{p.title}</span>
                      {p.topics?.slice(0, 2).map(t => (
                        <Badge key={t} variant="outline" className="text-[7px] px-1 py-0 h-3.5 hidden sm:inline-flex">{t}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge variant="outline" className={cn('text-[8px] px-1.5 py-0', getDifficultyColor(p.difficulty))}>{p.difficulty}</Badge>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </GlowCard>
        )}

        <div className="lg:col-span-2 space-y-3">
          {patternsMastered.length > 0 && (
            <GlowCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">Patterns Mastered</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {patternsMastered.map(p => (
                  <Badge key={p} variant="secondary" className="text-[9px] px-2 py-0.5">{p}</Badge>
                ))}
              </div>
            </GlowCard>
          )}

          {strongTopics.length >= 3 && (
            <GlowCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">Ready to Level Up</h3>
              </div>
              <p className="text-[11px] text-muted-foreground">
                You've mastered {strongTopics.length} topics. Try harder problems in these areas to push further.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2 text-[10px] h-7 gap-1">
                <Link href="/practice?difficulty=Hard">
                  <Rocket className="w-3 h-3" />
                  Try Hard Problems
                </Link>
              </Button>
            </GlowCard>
          )}
        </div>
      </div>

      {/* ========== LEARNING JOURNEY ========== */}
      {learningMilestones.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Learning Journey</h2>
          </div>
          <GlowCard className="p-4">
            <div className="relative">
              <div className="absolute left-3.5 top-1 bottom-1 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
              <div className="space-y-4">
                {learningMilestones.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 relative"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border z-10 bg-card border-border/50">
                      <m.icon className={cn('w-3.5 h-3.5', m.color)} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-xs font-medium text-foreground">{m.title}</p>
                      <p className="text-[9px] text-muted-foreground">{m.date}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlowCard>
        </div>
      )}

      {/* ========== RECENT ACTIVITY ========== */}
      {recentSubmissions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>
          <GlowCard className="p-4">
            <div className="space-y-1">
              {recentSubmissions.slice(0, 8).map((s, i) => {
                const problem = problems?.find(p => p.id === s.problemId);
                return (
                  <motion.div
                    key={s.id || i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20 transition-colors"
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                      s.verdict === 'Accepted' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    )}>
                      {s.verdict === 'Accepted'
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-foreground truncate">
                          {problem?.title || s.problemId}
                        </span>
                        <Badge variant="outline" className={cn(
                          'text-[7px] px-1 py-0 h-3.5',
                          s.verdict === 'Accepted' ? 'border-emerald-500/20 text-emerald-400' : 'border-red-500/20 text-red-400'
                        )}>
                          {s.verdict === 'Accepted' ? 'AC' : 'WA'}
                        </Badge>
                      </div>
                      <p className="text-[9px] text-muted-foreground">
                        {problem?.difficulty && `${problem.difficulty} · `}
                        {timeAgo(s.submittedAt)}
                        {s.executionTimeMs ? ` · ${s.executionTimeMs}ms` : ''}
                      </p>
                    </div>
                    {problem && (
                      <Link href={`/practice?problem=${s.problemId}`} className="text-[10px] text-primary hover:underline flex-shrink-0">
                        Review
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </GlowCard>
        </div>
      )}

      {/* ========== HEATMAP ========== */}
      {Object.keys(submissionsByDay).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Coding Activity</h2>
          </div>
          <GlowCard className="p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span>{Object.keys(submissionsByDay).length} active days</span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  {currentStreak} day streak
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span>Less</span>
                {[0, 1, 3, 6, 10].map((level) => (
                  <div key={level} className={cn(
                    'w-3 h-3 rounded-sm',
                    level === 0 ? 'bg-muted/20' : level <= 2 ? 'bg-emerald-900/40' : level <= 5 ? 'bg-emerald-700/60' : level <= 10 ? 'bg-emerald-500/80' : 'bg-emerald-400'
                  )} />
                ))}
                <span>More</span>
              </div>
            </div>
            <div className="overflow-x-auto pb-1">
              <div className="flex gap-[3px] min-w-max">
                {Array.from({ length: 53 }).map((_, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const dayIndex = weekIdx * 7 + dayIdx;
                      const d = new Date();
                      d.setDate(d.getDate() - (365 - dayIndex));
                      const dateStr = d.toISOString().slice(0, 10);
                      const count = submissionsByDay[dateStr] || 0;
                      return (
                        <div
                          key={dayIdx}
                          className={cn(
                            'w-[11px] h-[11px] rounded-sm transition-colors duration-150',
                            count === 0 ? 'bg-muted/20' : count <= 2 ? 'bg-emerald-900/40' : count <= 5 ? 'bg-emerald-700/60' : count <= 10 ? 'bg-emerald-500/80' : 'bg-emerald-400'
                          )}
                          title={`${dateStr}: ${count} submissions`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>
        </div>
      )}

      {/* ========== ACHIEVEMENTS ========== */}
      {achievements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold">Achievements</h2>
            <Badge variant="premium" className="ml-auto text-[9px] px-1.5 py-0">{achievements.length} unlocked</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a, i) => (
              <motion.div
                key={a.id || i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="group relative p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-card/80 transition-all text-center"
                style={{ minWidth: 100 }}
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{a.icon || '🏆'}</div>
                <p className="text-[10px] font-medium text-foreground">{a.title || a.id}</p>
                {a.desc && <p className="text-[8px] text-muted-foreground mt-0.5">{a.desc}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ========== XP / LEVEL PROGRESS ========== */}
      <GlowCard className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Gem className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">XP & Level Progress</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-lg font-bold font-mono"><AnimatedCounter value={xpInfo.level} /></p>
            <p className="text-[10px] text-muted-foreground">Current Level</p>
          </div>
          <div>
            <p className="text-lg font-bold font-mono"><AnimatedCounter value={xpInfo.currentXp} /></p>
            <p className="text-[10px] text-muted-foreground">Total XP</p>
          </div>
          <div>
            <p className="text-lg font-bold font-mono"><AnimatedCounter value={xpInfo.nextXp - xpInfo.currentXp} /></p>
            <p className="text-[10px] text-muted-foreground">XP to Next Level</p>
          </div>
          <div>
            <p className="text-lg font-bold font-mono"><AnimatedCounter value={totalSolved} /></p>
            <p className="text-[10px] text-muted-foreground">Total Solved</p>
          </div>
        </div>
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-primary to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(xpInfo.currentXp / xpInfo.nextXp) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </GlowCard>

      {/* ========== BOTTOM CTA ========== */}
      <div className="flex items-center justify-center gap-4 pt-2 pb-6">
        <Button asChild variant="outline" size="sm" className="gap-1.5 text-[11px] h-8">
          <Link href="/practice">
            <Code2 className="w-3.5 h-3.5" />
            Continue Practicing
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5 text-[11px] h-8">
          <Link href="/learning">
            <BookOpen className="w-3.5 h-3.5" />
            View Lessons
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5 text-[11px] h-8">
          <Link href="/analytics">
            <BarChart3 className="w-3.5 h-3.5" />
            Full Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
