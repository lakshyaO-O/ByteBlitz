'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, Zap, Crown, Map, ChevronRight, ChevronDown, Clock,
  BookOpen, CheckCircle2, Target, Star, Lightbulb, Save, ArrowRight,
  GraduationCap, BarChart3, Layers, Calendar, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { checkAILimit, incrementAILimit } from '@/services/ai-usage';
import { toast } from '@/hooks/use-toast';

interface RoadmapPhase {
  title: string;
  description: string;
  topics: string[];
  resources: string[];
  milestones: string[];
  duration: string;
}

interface WeeklySchedule {
  day: string;
  focus: string;
  tasks: string[];
  duration: string;
}

interface RoadmapResult {
  title: string;
  description: string;
  phases: RoadmapPhase[];
  weeklySchedule: WeeklySchedule[];
  tips: string[];
}

interface Step {
  id: number;
  title: string;
  fields: string[];
}

const STEPS: Step[] = [
  { id: 1, title: 'Current Level', fields: ['level'] },
  { id: 2, title: 'Your Goal', fields: ['goal'] },
  { id: 3, title: 'Languages', fields: ['languages'] },
  { id: 4, title: 'Time Commitment', fields: ['timeCommitment'] },
  { id: 5, title: 'Topics of Interest', fields: ['topics'] },
];

export default function AIRoadmapPage() {
  const { user, loading: authLoading } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [level, setLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [languages, setLanguages] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');
  const [topics, setTopics] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapResult | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const [usage, setUsage] = useState<{ remaining: number; limit: number } | null>(null);

  useEffect(() => {
    if (user) {
      checkAILimit(user.uid, 'roadmap').then((r: any) => {
        setUsage({ remaining: r.remaining, limit: r.limit });
      });
    }
  }, [user]);

  const togglePhase = (index: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return level.trim().length > 0;
      case 1: return goal.trim().length > 0;
      case 2: return languages.trim().length > 0;
      case 3: return timeCommitment.trim().length > 0;
      case 4: return topics.trim().length > 0;
      default: return false;
    }
  };

  const handleGenerate = async () => {
    if (usage && usage.remaining <= 0) {
      toast({ title: 'Daily limit reached', description: 'Upgrade to Pro for more roadmaps.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, goal, languages, timeCommitment, topics }),
      });

      if (!res.ok) throw new Error('Failed to generate roadmap');

      const data = await res.json();
      const parsed: RoadmapResult = typeof data.response === 'string'
        ? JSON.parse(data.response)
        : data.response || data;

      setRoadmap(parsed);

      if (user) {
        await incrementAILimit(user.uid, 'roadmap');
        const updated = await checkAILimit(user.uid, 'roadmap');
        setUsage({ remaining: updated.remaining, limit: updated.limit });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate roadmap. Try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    toast({ title: 'Saved!', description: 'Roadmap has been saved to your profile.' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (roadmap) {
    return (
      <Shell>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-black tracking-tight">
                Your <span className="text-primary">Roadmap</span>
              </h1>
              <p className="text-muted-foreground text-sm">{roadmap.title}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSave}>
                <Save className="w-4 h-4" /> Save
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setRoadmap(null); setCurrentStep(0); }}>
                New Roadmap
              </Button>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-headline font-bold">{roadmap.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{roadmap.description}</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-headline font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Learning Phases
            </h3>
            {roadmap.phases.map((phase, index) => (
              <Card key={index} className="bg-card/50 border-border overflow-hidden">
                <button
                  onClick={() => togglePhase(index)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold">{phase.title}</p>
                      <p className="text-xs text-muted-foreground">{phase.duration}</p>
                    </div>
                  </div>
                  {expandedPhases.has(index) ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {expandedPhases.has(index) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                        <p className="text-sm text-muted-foreground">{phase.description}</p>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Topics</p>
                          <div className="flex flex-wrap gap-1.5">
                            {phase.topics.map((t, i) => (
                              <Badge key={i} variant="secondary" className="text-[9px] uppercase tracking-widest">{t}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Resources</p>
                          <ul className="space-y-1">
                            {phase.resources.map((r, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Milestones</p>
                          <ul className="space-y-1">
                            {phase.milestones.map((m, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-headline font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Weekly Schedule
            </h3>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4 space-y-3">
                {roadmap.weeklySchedule.map((day, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                    <div className="w-16 shrink-0 text-xs font-bold uppercase tracking-widest text-primary">{day.day}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{day.focus}</p>
                      <ul className="mt-1 space-y-0.5">
                        {day.tasks.map((task, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">{day.duration}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" /> Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {roadmap.tips.map((tip, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Star className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-headline font-black tracking-tight">
            AI <span className="text-primary">Roadmap</span>
          </h1>
          <p className="text-muted-foreground text-sm">Answer a few questions and get a personalized learning roadmap.</p>
          {usage && (
            <Badge variant="outline" className={cn('text-xs gap-1.5', usage.remaining > 0 ? 'border-primary/30 text-primary' : 'border-destructive/30 text-destructive')}>
              <Zap className="w-3.5 h-3.5" /> {usage.remaining}/{usage.limit} today
            </Badge>
          )}
        </div>

        {usage && usage.remaining <= 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Crown className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm flex-1 font-bold">Daily roadmap limit reached.</p>
              <Button variant="default" size="sm" className="gap-1.5"><Crown className="w-4 h-4" /> Upgrade</Button>
            </CardContent>
          </Card>
        )}

        <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-1.5" />

        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-lg font-headline font-bold">
              Step {currentStep + 1} of {STEPS.length}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{STEPS[currentStep].title}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep === 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setLevel(opt)}
                      className={cn(
                        'p-3 rounded-lg border text-sm font-bold transition-all text-center',
                        level === opt
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/30'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {currentStep === 1 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What do you want to achieve?</label>
                <Textarea
                  placeholder="e.g. Build a full-stack web app, land a job at Google, become competitive programming expert..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="min-h-[120px] bg-muted/30 border-border resize-y"
                />
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Languages you know / use</label>
                <Input
                  placeholder="e.g. Python, JavaScript, Java, C++"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  className="bg-muted/30 border-border"
                />
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Time commitment (hours per week)</label>
                <div className="grid grid-cols-4 gap-2">
                  {['2-3', '5-7', '10-15', '20+'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTimeCommitment(opt)}
                      className={cn(
                        'p-3 rounded-lg border text-sm font-bold transition-all text-center',
                        timeCommitment === opt
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/30'
                      )}
                    >
                      {opt}h
                    </button>
                  ))}
                </div>
              </div>
            )}
            {currentStep === 4 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Topics of interest</label>
                <div className="flex flex-wrap gap-2">
                  {['DSA', 'Web Development', 'System Design', 'AI/ML', 'Mobile Dev', 'DevOps', 'Databases', 'Cybersecurity'].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => {
                        const current = topics ? topics.split(', ') : [];
                        const updated = current.includes(topic)
                          ? current.filter((t) => t !== topic)
                          : [...current, topic];
                        setTopics(updated.join(', '));
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest transition-all',
                        topics.includes(topic)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/30'
                      )}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between gap-4">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0} className="gap-1.5">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()} className="gap-1.5">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={!canProceed() || isLoading} className="gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? 'Generating...' : 'Generate Roadmap'}
            </Button>
          )}
        </div>

        <div className="flex justify-center gap-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                step.id - 1 < currentStep ? 'bg-primary' : step.id - 1 === currentStep ? 'bg-primary/60 scale-125' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>
    </Shell>
  );
}
