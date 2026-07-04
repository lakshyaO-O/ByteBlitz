'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Lock, ChevronRight, Star, Zap, Trophy, Sparkles,
  BookOpen, Lightbulb, Target, ArrowRight, Clock, BarChart3, GraduationCap,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app-store';
import { lessons, totalLessons, type LessonData } from '@/data/lessons';
import { LessonViewer } from '@/components/learning/LessonViewer';

interface CompleteRoadmapProps {
  onStartLesson?: (lesson: LessonData) => void;
}

const iconMap: Record<string, any> = {
  BookOpen, Zap, Target, Lightbulb, Star, Trophy,
};

const difficultyColors: Record<string, string> = {
  beginner: 'text-emerald-400',
  easy: 'text-blue-400',
  medium: 'text-amber-400',
  hard: 'text-destructive',
};

function LessonIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] || BookOpen;
  return <Icon className={className} />;
}

export function CompleteRoadmap({ onStartLesson }: CompleteRoadmapProps) {
  const {
    state, completeLessonFull, addXp, addCoins, markLessonRead, markQuizPassed, markChallengePassed,
  } = useAppStore();
  const { beginner } = state;
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonData | null>(null);
  const [showCelebration, setShowCelebration] = useState<number | null>(null);

  const completedIds = beginner.lessonsCompleted;
  const lessonProgress = beginner.lessonProgress;

  const isUnlocked = (id: number) => id === 1 || completedIds.includes(id - 1);
  const isCompleted = (id: number) => completedIds.includes(id);
  const isCurrent = (id: number) => {
    const wasCompleted = completedIds.includes(id);
    const prevCompleted = id === 1 || completedIds.includes(id - 1);
    return prevCompleted && !wasCompleted;
  };

  const getLessonStatus = (id: number) => {
    const prog = lessonProgress[id];
    if (!prog) return { read: false, quizPassed: false, challengePassed: false, xpAwarded: false };
    return prog;
  };

  const handleStartLesson = (lesson: LessonData) => {
    setActiveLesson(lesson);
    onStartLesson?.(lesson);
  };

  const handleLessonComplete = (lessonId: number) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    completeLessonFull(lessonId, lesson.xpReward, lesson.coinReward);
    setShowCelebration(lessonId);
    setTimeout(() => setShowCelebration(null), 3000);
  };

  const handleBackToRoadmap = () => {
    setActiveLesson(null);
  };

  const handleNextLesson = () => {
    if (!activeLesson) return;
    const nextIdx = lessons.findIndex(l => l.id === activeLesson.id) + 1;
    if (nextIdx < lessons.length) {
      setActiveLesson(lessons[nextIdx]);
    }
  };

  if (activeLesson) {
    const currentIdx = lessons.findIndex(l => l.id === activeLesson.id);
    const hasNext = currentIdx < lessons.length - 1;
    return (
      <LessonViewer
        lesson={activeLesson}
        onComplete={handleLessonComplete}
        onBack={handleBackToRoadmap}
        onNextLesson={handleNextLesson}
        isLastLesson={currentIdx === lessons.length - 1}
        hasNextLesson={hasNext}
      />
    );
  }

  const completedCount = completedIds.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-headline font-bold">Your Learning Roadmap</h2>
          <p className="text-xs text-muted-foreground">
            {completedCount} of {totalLessons} lessons completed
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-bold">{beginner.xp} XP</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold">{completedCount}/{totalLessons}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalLessons) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total XP</p>
          <p className="text-lg font-headline font-bold text-primary">{beginner.xp}</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-muted" />

        {lessons.map((lesson, index) => {
          const unlocked = isUnlocked(lesson.id);
          const completed = isCompleted(lesson.id);
          const current = isCurrent(lesson.id);
          const expanded = expandedLesson === lesson.id;
          const status = getLessonStatus(lesson.id);

          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="relative pl-12 pb-4"
            >
              <div className="absolute left-[14px] top-1">
                {completed ? (
                  <div className="relative">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"
                    />
                  </div>
                ) : current ? (
                  <div className="w-5 h-5 rounded-full bg-primary animate-pulse ring-2 ring-primary/30" />
                ) : unlocked ? (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>

              <Card
                className={cn(
                  'border transition-all cursor-pointer overflow-hidden',
                  current
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                    : completed
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : unlocked
                    ? 'border-border/80 hover:border-border hover:shadow-sm'
                    : 'border-border/30 opacity-45'
                )}
                onClick={() => unlocked && setExpandedLesson(expanded ? null : lesson.id)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <LessonIcon name={lesson.icon} className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn('font-bold text-sm truncate', completed && 'text-emerald-400')}>
                          {lesson.title}
                        </h3>
                        {completed && <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30 h-5">Done</Badge>}
                        {current && <Badge className="text-[9px] bg-primary text-primary-foreground h-5 animate-pulse">Ready</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{lesson.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={cn('text-[9px] font-mono', difficultyColors[lesson.difficulty] + ' border-transparent bg-transparent')}>
                        <BarChart3 className="w-2.5 h-2.5 mr-0.5" /> {lesson.difficulty}
                      </Badge>
                      <span className="text-[10px] text-primary font-mono font-bold">+{lesson.xpReward} XP</span>
                      {unlocked && !completed && (
                        <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-4">
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>

                          {status.challengePassed && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" /> Fully completed
                            </div>
                          )}
                          {status.read && !status.quizPassed && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                              <BookOpen className="w-4 h-4" /> Read — quiz remaining
                            </div>
                          )}
                          {status.quizPassed && !status.challengePassed && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                              <GraduationCap className="w-4 h-4" /> Quiz passed — challenge remaining
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" /> ~{lesson.estimatedMinutes} min
                            <span className="mx-1">·</span>
                            <Code2 className="w-3 h-3" /> {lesson.quiz.length} quiz questions
                            <span className="mx-1">·</span>
                            <Star className="w-3 h-3 text-yellow-400" /> +{lesson.coinReward} coins
                          </div>

                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-primary mb-2">Topics</p>
                            <div className="flex flex-wrap gap-1.5">
                              {lesson.topics.map(topic => (
                                <span key={topic} className="px-2 py-1 text-[10px] bg-muted/50 rounded-md text-muted-foreground">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>

                          {lesson.realLifeAnalogy && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <p className="text-[11px] font-medium uppercase tracking-wider text-amber-400 mb-1">Real-life analogy</p>
                              <p className="text-xs text-muted-foreground">{lesson.realLifeAnalogy}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-2">
                            {completed ? (
                              <Badge variant="outline" className="gap-1 text-emerald-400 border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Completed
                              </Badge>
                            ) : unlocked ? (
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (lesson.id === 16) {
                                    window.location.href = '/arena';
                                    return;
                                  }
                                  handleStartLesson(lesson);
                                }}
                              >
                                {current ? 'Start Learning' : 'Continue'} <ArrowRight className="w-3 h-3" />
                              </Button>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Lock className="w-3 h-3" /> Complete previous lesson first
                              </div>
                            )}
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Zap className="w-3 h-3 text-primary" /> +{lesson.xpReward} XP
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>

              <AnimatePresence>
                {showCelebration === lesson.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="fixed top-4 right-4 z-50"
                  >
                    <Card className="bg-emerald-500/20 border-emerald-400/30 p-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <div>
                          <p className="font-bold text-sm">Lesson Complete!</p>
                          <p className="text-xs text-muted-foreground">+{lesson.xpReward} XP earned</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
