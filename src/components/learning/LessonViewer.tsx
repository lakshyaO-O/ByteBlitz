'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BookOpen, Lightbulb, AlertTriangle, Star, CheckCircle2,
  Sparkles, Code2, Zap, GraduationCap, Trophy, ExternalLink, Clock, BarChart3, Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QuizSection } from '@/components/learning/QuizSection';
import { CodePlayground } from '@/components/learning/CodePlayground';
import type { LessonData } from '@/data/lessons';

interface LessonViewerProps {
  lesson: LessonData;
  onComplete: (lessonId: number) => void;
  onBack: () => void;
  onNextLesson?: () => void;
  isLastLesson: boolean;
  hasNextLesson: boolean;
}

type Section = 'reading' | 'examples' | 'syntax' | 'playground' | 'quiz' | 'challenge' | 'summary';

const sectionIcons: Record<Section, any> = {
  reading: BookOpen,
  examples: Code2,
  syntax: Code2,
  playground: Zap,
  quiz: GraduationCap,
  challenge: Trophy,
  summary: Star,
};

const sectionLabels: Record<Section, string> = {
  reading: 'Read',
  examples: 'Examples',
  syntax: 'Syntax',
  playground: 'Practice',
  quiz: 'Quiz',
  challenge: 'Challenge',
  summary: 'Summary',
};

const difficultyColors: Record<string, string> = {
  beginner: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  easy: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  hard: 'text-destructive bg-destructive/10 border-destructive/20',
};

export function LessonViewer({ lesson, onComplete, onBack, onNextLesson, isLastLesson, hasNextLesson }: LessonViewerProps) {
  const [currentSection, setCurrentSection] = useState<Section>('reading');
  const [readingComplete, setReadingComplete] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [challengePassed, setChallengePassed] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [markedAsRead, setMarkedAsRead] = useState(false);

  useEffect(() => {
    setCurrentSection('reading');
    setReadingComplete(false);
    setQuizPassed(false);
    setChallengePassed(false);
    setXpAwarded(false);
    setShowCompletion(false);
    setMarkedAsRead(false);
  }, [lesson.id]);

  const sections: Section[] = ['reading', 'examples', 'syntax', 'playground', 'quiz', 'challenge', 'summary'];
  const currentIndex = sections.indexOf(currentSection);

  const goToSection = (section: Section) => {
    if (section === 'quiz' && !readingComplete) return;
    if (section === 'challenge' && !quizPassed) return;
    if (section === 'summary' && !challengePassed) return;
    setCurrentSection(section);
  };

  const handleMarkRead = () => {
    setReadingComplete(true);
    setMarkedAsRead(true);
  };

  const handleQuizComplete = (passed: boolean) => {
    if (passed) setQuizPassed(true);
  };

  const handleChallengeSuccess = () => {
    setChallengePassed(true);
  };

  const handleFinish = () => {
    if (!xpAwarded) {
      setXpAwarded(true);
      setShowCompletion(true);
      onComplete(lesson.id);
    }
  };

  const navItems = sections.map((section, i) => {
    let status: 'locked' | 'available' | 'current' | 'done' = 'available';
    if (section === 'reading' && !readingComplete && currentSection !== 'reading') status = 'available';
    else if (section === 'reading' && readingComplete) status = 'done';
    else if (section === 'reading') status = 'current';
    else if (section === 'examples' || section === 'syntax' || section === 'playground') {
      if (currentSection === section) status = 'current';
      else if (readingComplete) status = 'done';
      else status = 'available';
    } else if (section === 'quiz') {
      if (currentSection === 'quiz') status = 'current';
      else if (quizPassed) status = 'done';
      else if (!readingComplete) status = 'locked';
      else status = 'available';
    } else if (section === 'challenge') {
      if (currentSection === 'challenge') status = 'current';
      else if (challengePassed && currentSection === 'summary') status = 'done';
      else if (challengePassed) status = 'done';
      else if (!quizPassed) status = 'locked';
      else status = 'available';
    } else if (section === 'summary') {
      if (currentSection === 'summary') status = 'current';
      else if (!challengePassed) status = 'locked';
      else status = 'available';
    }

    return { section, label: sectionLabels[section], icon: sectionIcons[section], status, index: i };
  });

  const canProgress = () => {
    switch (currentSection) {
      case 'reading': return readingComplete;
      case 'quiz': return quizPassed;
      case 'challenge': return challengePassed;
      case 'summary': return true;
      default: return true;
    }
  };

  const handleNextSection = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < sections.length) {
      setCurrentSection(sections[nextIdx]);
    }
  };

  const sectionProgress = sections.reduce((acc, s, i) => {
    if (s === 'reading' && readingComplete) acc++;
    else if (s === 'quiz' && quizPassed) acc++;
    else if (s === 'challenge' && challengePassed) acc++;
    else if (s === currentSection) {}
    else if (i < currentIndex && !['reading', 'quiz', 'challenge'].includes(s)) acc++;
    return acc;
  }, 0);

  const requiredCount = 3;
  const completedRequired = [readingComplete, quizPassed, challengePassed].filter(Boolean).length;
  const progressPercent = Math.round((completedRequired / requiredCount) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn('text-[11px] uppercase tracking-wider font-mono', difficultyColors[lesson.difficulty])}>
                <BarChart3 className="w-3 h-3 mr-1" /> {lesson.difficulty}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border/50">
                <Clock className="w-3 h-3 mr-1" /> {lesson.estimatedMinutes} min
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
                <Zap className="w-3 h-3 mr-1" /> +{lesson.xpReward} XP
              </Badge>
            </div>
            <h1 className="text-2xl font-headline font-bold">{lesson.title}</h1>
            <p className="text-sm text-muted-foreground">{lesson.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Progress</p>
            <p className="text-lg font-headline font-bold text-primary">{progressPercent}%</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {navItems.map(({ section, label, icon: Icon, status, index }) => (
          <button
            key={section}
            onClick={() => goToSection(section)}
            disabled={status === 'locked'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all',
              status === 'current' && 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_12px_rgba(6,182,212,0.1)]',
              status === 'done' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
              status === 'available' && 'bg-muted/20 text-muted-foreground border border-transparent hover:bg-muted/30',
              status === 'locked' && 'bg-muted/10 text-muted-foreground/30 border border-transparent cursor-not-allowed',
            )}
          >
            {status === 'done' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <Card className="border-border/60 bg-card/40">
        <div className="p-6">
          <AnimatePresence mode="wait">
            {currentSection === 'reading' && (
              <motion.div
                key="reading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <BookOpen className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{lesson.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Read through the explanation below to understand the core concepts.</p>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none space-y-4">
                  {lesson.explanation.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-sm leading-relaxed text-muted-foreground">{paragraph}</p>
                  ))}
                </div>

                {lesson.realLifeAnalogy && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Real-Life Analogy</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{lesson.realLifeAnalogy}</p>
                  </div>
                )}

                {lesson.commonMistakes.length > 0 && (
                  <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <p className="text-xs font-bold uppercase tracking-widest text-destructive">Common Mistakes</p>
                    </div>
                    <ul className="space-y-2">
                      {lesson.commonMistakes.map((mistake, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-destructive mt-1">•</span>
                          {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {lesson.proTips.length > 0 && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-primary" />
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Pro Tips</p>
                    </div>
                    <ul className="space-y-2">
                      {lesson.proTips.map((tip, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">✦</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={handleMarkRead}
                  className={cn(
                    'w-full py-3 rounded-xl font-bold text-sm transition-all',
                    readingComplete
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  {readingComplete ? (
                    <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Marked as Read</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2"><BookOpen className="w-4 h-4" /> Mark as Read & Continue</span>
                  )}
                </button>
              </motion.div>
            )}

            {currentSection === 'examples' && (
              <motion.div
                key="examples"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-headline font-bold">Visual Examples</h2>
                </div>
                {lesson.visualExamples.map((example, i) => (
                  <div key={i} className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/50">
                    <p className="text-sm font-bold">{example.title}</p>
                    <pre className="p-3 rounded-lg bg-black/40 border border-border/40 text-sm font-mono text-cyan-200 overflow-x-auto">
                      {example.code}
                    </pre>
                    <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400 mb-1">Output</p>
                      <pre className="text-sm font-mono text-emerald-200 whitespace-pre-wrap">{example.output}</pre>
                    </div>
                    <p className="text-sm text-muted-foreground">{example.explanation}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {currentSection === 'syntax' && (
              <motion.div
                key="syntax"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-headline font-bold">Syntax Reference</h2>
                </div>
                {lesson.syntax.map((block, i) => (
                  <div key={i} className="space-y-2">
                    <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
                      {block.language}
                    </Badge>
                    <pre className="p-3 rounded-xl bg-black/40 border border-border/40 text-sm font-mono text-cyan-200 overflow-x-auto">
                      {block.code}
                    </pre>
                    <p className="text-xs text-muted-foreground">{block.notes}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {currentSection === 'playground' && (
              <motion.div
                key="playground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-headline font-bold">Practice Playground</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Experiment with the concepts you just learned. Try modifying the code and see what happens!
                </p>
                <CodePlayground
                  starterCode={lesson.visualExamples[0]?.code || '// Try it yourself!\n'}
                  language="javascript"
                  height="350px"
                />
              </motion.div>
            )}

            {currentSection === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-headline font-bold">Knowledge Check</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Test your understanding with these questions. You need at least 60% to pass.
                </p>
                <QuizSection
                  questions={lesson.quiz}
                  onComplete={handleQuizComplete}
                />
              </motion.div>
            )}

            {currentSection === 'challenge' && (
              <motion.div
                key="challenge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-headline font-bold">Coding Challenge</h2>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm font-bold">{lesson.codingChallenge.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{lesson.codingChallenge.instructions}</p>
                </div>
                <CodePlayground
                  starterCode={lesson.codingChallenge.starterCode}
                  expectedOutput={lesson.codingChallenge.expectedOutput}
                  testCases={lesson.codingChallenge.testCases}
                  solution={lesson.codingChallenge.solution}
                  hint={lesson.codingChallenge.hint}
                  language="javascript"
                  onSuccess={handleChallengeSuccess}
                  height="350px"
                />
              </motion.div>
            )}

            {currentSection === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-headline font-bold">Lesson Summary</h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className={cn('p-4 rounded-xl border text-center space-y-2', readingComplete ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-muted/20 border-border/50')}>
                    {readingComplete ? <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" /> : <BookOpen className="w-6 h-6 text-muted-foreground mx-auto" />}
                    <p className="text-[11px] font-medium uppercase tracking-wider">Read</p>
                  </div>
                  <div className={cn('p-4 rounded-xl border text-center space-y-2', quizPassed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-muted/20 border-border/50')}>
                    {quizPassed ? <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" /> : <GraduationCap className="w-6 h-6 text-muted-foreground mx-auto" />}
                    <p className="text-[11px] font-medium uppercase tracking-wider">Quiz</p>
                  </div>
                  <div className={cn('p-4 rounded-xl border text-center space-y-2', challengePassed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-muted/20 border-border/50')}>
                    {challengePassed ? <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" /> : <Trophy className="w-6 h-6 text-muted-foreground mx-auto" />}
                    <p className="text-[11px] font-medium uppercase tracking-wider">Challenge</p>
                  </div>
                </div>

                {([readingComplete, quizPassed, challengePassed].every(Boolean)) && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border-emerald-500/30 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-primary mx-auto" />
                    <p className="text-lg font-headline font-bold">Lesson Complete!</p>
                    <p className="text-sm text-muted-foreground">You earned <span className="text-primary font-bold">+{lesson.xpReward} XP</span> and <span className="text-yellow-400 font-bold">+{lesson.coinReward} coins</span>.</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Key Takeaways</p>
                  <ul className="space-y-2">
                    {lesson.summary.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {lesson.additionalResources.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Additional Resources</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {lesson.additionalResources.map((res, i) => (
                        <a
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors text-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="flex-1 min-w-0 truncate">{res.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{res.platform}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {!xpAwarded && ([readingComplete, quizPassed, challengePassed].every(Boolean)) && (
                  <button
                    onClick={handleFinish}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" /> Claim Rewards (+{lesson.xpReward} XP)
                  </button>
                )}

                {xpAwarded && (
                  <div className="flex justify-center gap-3">
                    {hasNextLesson && onNextLesson && (
                      <Button onClick={onNextLesson} className="gap-2">
                        Next Lesson <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="outline" onClick={onBack}>
                      Back to Roadmap
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {currentSection !== 'summary' && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {sections.slice(0, currentIndex + 1).map((s, i) => (
              <div key={s} className={cn(
                'w-2.5 h-2.5 rounded-full transition-colors',
                s === 'reading' && readingComplete && 'bg-emerald-400',
                s === 'quiz' && quizPassed && 'bg-emerald-400',
                s === 'challenge' && challengePassed && 'bg-emerald-400',
                s === currentSection && !(
                  (s === 'reading' && readingComplete) ||
                  (s === 'quiz' && quizPassed) ||
                  (s === 'challenge' && challengePassed)
                ) && 'bg-primary',
                !(
                  (s === 'reading' && readingComplete) ||
                  (s === 'quiz' && quizPassed) ||
                  (s === 'challenge' && challengePassed)
                ) && s !== currentSection && 'bg-muted'
              )} />
            ))}
          </div>

          <button
            onClick={handleNextSection}
            disabled={!canProgress() && currentIndex < sections.length - 1}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all',
              canProgress() || currentIndex >= sections.length - 1
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted/20 text-muted-foreground/50 cursor-not-allowed'
            )}
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-headline font-bold text-sm">Lesson Complete!</p>
                  <p className="text-xs text-muted-foreground">+{lesson.xpReward} XP earned</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
