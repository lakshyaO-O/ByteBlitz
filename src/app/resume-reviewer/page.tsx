'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText, Loader2, Zap, Crown, Star, CheckCircle2, AlertTriangle,
  Lightbulb, ArrowRight, Target, Upload, Download, Sparkles,
  XCircle, Briefcase, GraduationCap, Tag, ListChecks,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { checkAILimit, incrementAILimit } from '@/services/ai-usage';
import { toast } from '@/hooks/use-toast';

interface SectionSuggestion {
  section: string;
  before: string;
  after: string;
}

interface ResumeReviewResult {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: Array<{ issue: string; severity: 'critical' | 'major' | 'minor'; suggestion: string }>;
  sectionSuggestions: SectionSuggestion[];
  missingKeywords: string[];
  actionItems: string[];
}

export default function ResumeReviewerPage() {
  const { user, loading: authLoading } = useUser();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResumeReviewResult | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [usage, setUsage] = useState<{ remaining: number; limit: number } | null>(null);

  useEffect(() => {
    if (user) {
      checkAILimit(user.uid, 'resumeReview').then((r: any) => {
        setUsage({ remaining: r.remaining, limit: r.limit });
      });
    }
  }, [user]);

  const toggleCheckItem = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleReview = async () => {
    if (!resumeText.trim() || isLoading) return;

    if (usage && usage.remaining <= 0) {
      toast({ title: 'Daily limit reached', description: 'Upgrade to Pro for more resume reviews.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/resume-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescription.trim() || undefined,
          targetRole: targetRole.trim() || undefined,
          yearsExperience: yearsExperience.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Review failed');

      const data = await res.json();
      const parsed: ResumeReviewResult = typeof data.response === 'string'
        ? JSON.parse(data.response)
        : data.response || data;

      setResult(parsed);

      if (user) {
        await incrementAILimit(user.uid, 'resumeReview');
        const updated = await checkAILimit(user.uid, 'resumeReview');
        setUsage({ remaining: updated.remaining, limit: updated.limit });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to review resume. Try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black tracking-tight">
              Resume <span className="text-primary">Reviewer</span>
            </h1>
            <p className="text-muted-foreground text-sm">AI-powered resume analysis to help you land your dream job.</p>
          </div>
          {usage && (
            <Badge variant="outline" className={cn('text-xs gap-1.5 px-3 py-1.5', usage.remaining > 0 ? 'border-primary/30 text-primary' : 'border-destructive/30 text-destructive')}>
              <Zap className="w-3.5 h-3.5" /> {usage.remaining}/{usage.limit} today
            </Badge>
          )}
        </div>

        {usage && usage.remaining <= 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Crown className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm flex-1 font-bold">Daily review limit reached.</p>
              <Button variant="default" size="sm" className="gap-1.5"><Crown className="w-4 h-4" /> Upgrade</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[250px] text-sm bg-muted/30 border-border resize-y"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Upload className="w-3.5 h-3.5" />
                  File upload coming soon
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" /> Context (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Target Role</label>
                  <Input
                    placeholder="e.g. Senior Frontend Engineer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="bg-muted/30 border-border"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Years of Experience</label>
                  <Input
                    placeholder="e.g. 5"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="bg-muted/30 border-border"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Job Description</label>
                  <Textarea
                    placeholder="Paste the job description for targeted feedback..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[120px] text-sm bg-muted/30 border-border resize-y"
                  />
                </div>
                <Button
                  onClick={handleReview}
                  disabled={!resumeText.trim() || isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isLoading ? 'Analyzing...' : 'Review Resume'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-muted/50 animate-pulse" />
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : result ? (
                <ScrollArea className="h-[600px] pr-2">
                  <div className="space-y-6">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-4">
                      <div className="relative w-28 h-28">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={result.overallScore >= 80 ? '#34d399' : result.overallScore >= 50 ? '#fbbf24' : '#f87171'}
                            strokeWidth="3"
                            strokeDasharray={`${result.overallScore}, ${100 - result.overallScore}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={cn(
                            'text-3xl font-headline font-bold',
                            result.overallScore >= 80 ? 'text-emerald-400' : result.overallScore >= 50 ? 'text-yellow-400' : 'text-destructive'
                          )}>
                            {result.overallScore}
                          </span>
                        </div>
                      </div>
                      <p className="text-lg font-headline font-bold">Overall Score</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Summary</p>
                      <p className="text-sm p-3 rounded-lg bg-muted/30 border border-border/50">{result.summary}</p>
                    </motion.div>

                    {result.strengths.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Strengths
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.strengths.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 uppercase tracking-widest">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {result.weaknesses.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Weaknesses
                        </p>
                        <ul className="space-y-2">
                          {result.weaknesses.map((w, i) => (
                            <li key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={w.severity === 'critical' ? 'destructive' : w.severity === 'major' ? 'default' : 'secondary'} className="text-[9px] uppercase tracking-widest">
                                  {w.severity}
                                </Badge>
                              </div>
                              <p className="text-sm">{w.issue}</p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                                <Lightbulb className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                                {w.suggestion}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}

                    {result.sectionSuggestions.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" /> Before / After Suggestions
                        </p>
                        <div className="space-y-3">
                          {result.sectionSuggestions.map((s, i) => (
                            <div key={i} className="p-3 rounded-lg border border-border/50">
                              <Badge variant="outline" className="text-[9px] uppercase tracking-widest mb-2">{s.section}</Badge>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-destructive mb-1">Before</p>
                                  <p className="text-xs p-2 rounded bg-destructive/5 border border-destructive/20 font-mono">{s.before}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-1">After</p>
                                  <p className="text-xs p-2 rounded bg-emerald-500/5 border border-emerald-500/20 font-mono">{s.after}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {result.missingKeywords.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Missing Keywords
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.missingKeywords.map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] border-purple-500/30 text-purple-400 bg-purple-500/5 uppercase tracking-widest">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {result.actionItems.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                        <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-2 flex items-center gap-1">
                          <ListChecks className="w-3 h-3" /> Action Items
                        </p>
                        <div className="space-y-2">
                          {result.actionItems.map((item, i) => (
                            <label
                              key={i}
                              className={cn(
                                'flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                                checkedItems.has(i) ? 'bg-emerald-500/5 border border-emerald-500/20' : 'hover:bg-muted/30'
                              )}
                            >
                              <Checkbox
                                checked={checkedItems.has(i)}
                                onCheckedChange={() => toggleCheckItem(i)}
                                className="mt-0.5"
                              />
                              <span className={cn('text-sm', checkedItems.has(i) && 'line-through text-muted-foreground')}>
                                {item}
                              </span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-bold">No review yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Submit your resume to get AI-powered analysis.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
