'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Brain, Loader2, Zap, Crown, Star, ChevronRight, CheckCircle2,
  XCircle, Trophy, Target, BarChart3, Clock, MessageSquare,
  ArrowRight, Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { checkAILimit, incrementAILimit } from '@/services/ai-usage';
import { toast } from '@/hooks/use-toast';

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  hints?: string[];
}

interface AnswerFeedback {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
}

interface FinalSummary {
  overallScore: number;
  totalQuestions: number;
  averageScore: number;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
}

const TOPICS = [
  { value: 'dsa', label: 'DSA' },
  { value: 'system-design', label: 'System Design' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'sql', label: 'SQL' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

type Phase = 'setup' | 'interview' | 'feedback' | 'summary';

export default function AIInterviewerPage() {
  const { user, loading: authLoading } = useUser();
  const [topic, setTopic] = useState('dsa');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [summary, setSummary] = useState<FinalSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [usage, setUsage] = useState<{ remaining: number; limit: number } | null>(null);

  useEffect(() => {
    if (user) {
      checkAILimit(user.uid, 'interviewer').then((r: any) => {
        setUsage({ remaining: r.remaining, limit: r.limit });
      });
    }
  }, [user]);

  const handleStartInterview = async () => {
    if (usage && usage.remaining <= 0) {
      toast({ title: 'Daily limit reached', description: 'Upgrade to Pro for more interview sessions.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate ${questionCount} ${difficulty} ${topic} interview questions. Return as JSON array with id, question, category, difficulty.`,
          mode: 'interview-questions',
        }),
      });

      if (!res.ok) throw new Error('Failed to generate questions');

      const data = await res.json();
      const parsed: InterviewQuestion[] = typeof data.response === 'string'
        ? JSON.parse(data.response)
        : data.response || data;

      setQuestions(parsed);
      setPhase('interview');
      setCurrentIndex(0);
      setScores([]);
      setFeedback(null);
      setAnswer('');

      if (user) {
        await incrementAILimit(user.uid, 'interviewer');
        const updated = await checkAILimit(user.uid, 'interviewer');
        setUsage({ remaining: updated.remaining, limit: updated.limit });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to start interview. Try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Question: ${questions[currentIndex].question}\n\nMy Answer: ${answer}\n\nEvaluate this answer. Return JSON with score (0-100), feedback, strengths: string[], improvements: string[], suggestedAnswer: string.`,
          mode: 'interview-feedback',
        }),
      });

      if (!res.ok) throw new Error('Failed to get feedback');

      const data = await res.json();
      const parsed: AnswerFeedback = typeof data.response === 'string'
        ? JSON.parse(data.response)
        : data.response || data;

      setFeedback(parsed);
      setScores((prev) => [...prev, parsed.score]);
      setPhase('feedback');
    } catch {
      toast({ title: 'Error', description: 'Failed to get feedback. Try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setAnswer('');
      setFeedback(null);
      setPhase('interview');
    } else {
      generateSummary();
    }
  };

  const generateSummary = () => {
    const total = scores.length;
    const avg = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;
    const overallScore = avg;

    setSummary({
      overallScore,
      totalQuestions: total,
      averageScore: avg,
      strengths: feedback?.strengths || [],
      weakAreas: feedback?.improvements || [],
      recommendations: [
        'Practice more on weak areas',
        'Review system design patterns',
        'Work on communication clarity',
      ],
    });
    setPhase('summary');
  };

  const handleRestart = () => {
    setPhase('setup');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswer('');
    setFeedback(null);
    setSummary(null);
    setScores([]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black tracking-tight">
              AI <span className="text-primary">Interviewer</span>
            </h1>
            <p className="text-muted-foreground text-sm">Practice your interview skills with AI-powered mock interviews.</p>
          </div>
          {usage && (
            <Badge variant="outline" className={cn('text-xs gap-1.5 px-3 py-1.5', usage.remaining > 0 ? 'border-primary/30 text-primary' : 'border-destructive/30 text-destructive')}>
              <Zap className="w-3.5 h-3.5" /> {usage.remaining}/{usage.limit} sessions today
            </Badge>
          )}
        </div>

        {usage && usage.remaining <= 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Crown className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm flex-1 font-bold">Free session limit reached.</p>
              <Button variant="default" size="sm" className="gap-1.5"><Crown className="w-4 h-4" /> Upgrade</Button>
            </CardContent>
          </Card>
        )}

        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-headline font-bold">Interview Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Topic</label>
                      <Select value={topic} onValueChange={setTopic}>
                        <SelectTrigger className="bg-muted/30 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TOPICS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Difficulty</label>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger className="bg-muted/30 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTIES.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Questions (1-10)</label>
                      <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                        <SelectTrigger className="bg-muted/30 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleStartInterview} disabled={isLoading} className="w-full gap-2 h-12 text-base">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    {isLoading ? 'Generating Questions...' : 'Start Interview'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-bold">How it works</p>
                      <p className="text-xs text-muted-foreground">Answer questions, get instant feedback, and receive a final performance summary with score.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {phase === 'interview' && currentQuestion && (
            <motion.div key="interview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  Question {currentIndex + 1} of {questions.length}
                </div>
                <Badge variant="outline" className="text-xs">
                  <Target className="w-3 h-3 mr-1" /> {currentQuestion.difficulty}
                </Badge>
              </div>

              <Progress value={((currentIndex) / questions.length) * 100} className="h-1.5" />

              <Card className="bg-card/50 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{currentQuestion.category}</p>
                      <p className="text-lg font-headline font-bold">{currentQuestion.question}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Answer</label>
                <Textarea
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="min-h-[200px] bg-muted/30 border-border resize-y"
                />
                <Button onClick={handleSubmitAnswer} disabled={!answer.trim() || isLoading} className="w-full gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {isLoading ? 'Evaluating...' : 'Submit Answer'}
                </Button>
              </div>
            </motion.div>
          )}

          {phase === 'feedback' && feedback && (
            <motion.div key="feedback" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-headline font-bold',
                      feedback.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                      feedback.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-destructive/20 text-destructive'
                    )}>
                      {feedback.score}
                    </div>
                    <div>
                      <p className="text-lg font-headline font-bold">Answer Score</p>
                      <p className="text-xs text-muted-foreground">
                        {feedback.score >= 80 ? 'Excellent!' : feedback.score >= 50 ? 'Good effort' : 'Needs improvement'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Feedback</p>
                    <p className="text-sm">{feedback.feedback}</p>
                  </div>

                  {feedback.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Strengths</p>
                      <ul className="space-y-1">
                        {feedback.strengths.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedback.improvements.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-2">Areas to Improve</p>
                      <ul className="space-y-1">
                        {feedback.improvements.map((imp, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Suggested Answer</p>
                    <p className="text-sm p-3 rounded-lg bg-muted/30 border border-border/50">{feedback.suggestedAnswer}</p>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleNextQuestion} className="w-full gap-2 h-12">
                {currentIndex + 1 < questions.length ? (
                  <>Next Question <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>View Summary <BarChart3 className="w-4 h-4" /></>
                )}
              </Button>
            </motion.div>
          )}

          {phase === 'summary' && summary && (
            <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <Card className="bg-gradient-to-br from-primary/20 via-primary/5 to-secondary/10 border-primary/20">
                <CardContent className="p-8 text-center space-y-4">
                  <Trophy className="w-12 h-12 text-yellow-400 mx-auto" />
                  <h2 className="text-2xl font-headline font-bold">Interview Complete!</h2>
                  <div className={cn(
                    'w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-headline font-bold border-4',
                    summary.overallScore >= 80 ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10' :
                    summary.overallScore >= 50 ? 'border-yellow-400 text-yellow-400 bg-yellow-500/10' :
                    'border-destructive text-destructive bg-destructive/10'
                  )}>
                    {summary.overallScore}
                  </div>
                  <p className="text-lg font-bold">{summary.totalQuestions} Questions Answered</p>
                  <p className="text-sm text-muted-foreground">Average Score: {summary.averageScore}</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Strengths</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.strengths.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-2">Weak Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.weakAreas.map((w, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] border-destructive/30 text-destructive bg-destructive/5">
                          {w}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Recommendations</p>
                    <ul className="space-y-1">
                      {summary.recommendations.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Star className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleRestart} className="w-full gap-2" variant="outline">
                <Play className="w-4 h-4" /> Start New Interview
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}
