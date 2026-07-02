'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Code2, Loader2, Zap, Crown, Clock, CheckCircle2, AlertTriangle,
  Lightbulb, ArrowRight, ChevronRight, MessageSquare, ThumbsUp,
  FileCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { checkAILimit, incrementAILimit } from '@/services/ai-usage';
import { toast } from '@/hooks/use-toast';

interface ReviewFeedback {
  summary: string;
  strengths: string[];
  issues: Array<{ line: number; severity: 'critical' | 'warning' | 'suggestion'; message: string; suggestion: string }>;
  improvements: string[];
  score: number;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

export default function AICodeReviewPage() {
  const { user, loading: authLoading } = useUser();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<ReviewFeedback | null>(null);
  const [usage, setUsage] = useState<{ remaining: number; limit: number } | null>(null);
  const [recentReviews, setRecentReviews] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      checkAILimit(user.uid, 'codeReview').then((r) => {
        setUsage({ remaining: r.remaining, limit: r.limit });
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!code.trim() || isLoading) return;

    if (usage && usage.remaining <= 0) {
      toast({ title: 'Daily limit reached', description: 'Upgrade to Pro for more reviews.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Review this ${language} code:\n\n${code}`,
          mode: 'code-review',
        }),
      });

      if (!res.ok) throw new Error('Review failed');

      const data = await res.json();
      const parsed: ReviewFeedback = typeof data.response === 'string'
        ? JSON.parse(data.response)
        : data.response || data;

      setFeedback(parsed);
      setRecentReviews((prev) => [code.slice(0, 80) + '...', ...prev].slice(0, 5));

      if (user) {
        await incrementAILimit(user.uid, 'codeReview');
        const updated = await checkAILimit(user.uid, 'codeReview');
        setUsage({ remaining: updated.remaining, limit: updated.limit });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to review code. Try again.', variant: 'destructive' });
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
              AI Code <span className="text-primary">Review</span>
            </h1>
            <p className="text-muted-foreground text-sm">Get instant feedback on your code quality and best practices.</p>
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
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" /> Your Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full bg-muted/30 border-border">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Paste your code here for review..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[300px] font-mono text-sm bg-muted/30 border-border resize-y"
              />
              <Button
                onClick={handleSubmit}
                disabled={!code.trim() || isLoading}
                className="w-full gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
                {isLoading ? 'Reviewing...' : 'Review Code'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : feedback ? (
                <ScrollArea className="h-[400px] pr-2">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold',
                        feedback.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                        feedback.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-destructive/20 text-destructive'
                      )}>
                        {feedback.score}
                      </div>
                      <div>
                        <p className="font-bold text-sm">Code Quality Score</p>
                        <p className="text-xs text-muted-foreground">
                          {feedback.score >= 80 ? 'Great job!' : feedback.score >= 50 ? 'Needs improvement' : 'Major issues'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Summary</p>
                      <p className="text-sm">{feedback.summary}</p>
                    </div>

                    {feedback.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> Strengths
                        </p>
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

                    {feedback.issues.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Issues
                        </p>
                        <ul className="space-y-2">
                          {feedback.issues.map((issue, i) => (
                            <li key={i} className="text-sm p-3 rounded-lg bg-muted/30 border border-border/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={issue.severity === 'critical' ? 'destructive' : issue.severity === 'warning' ? 'default' : 'secondary'} className="text-[9px] uppercase tracking-widest">
                                  {issue.severity}
                                </Badge>
                                <span className="text-xs font-mono text-muted-foreground">Line {issue.line}</span>
                              </div>
                              <p>{issue.message}</p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                                <Lightbulb className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                                {issue.suggestion}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feedback.improvements.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> Suggestions
                        </p>
                        <ul className="space-y-1">
                          {feedback.improvements.map((imp, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <ArrowRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <Code2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-bold">No review yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Submit your code to get AI-powered feedback.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {recentReviews.length > 0 && (
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Recent Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentReviews.map((review, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                    <ChevronRight className="w-3 h-3 shrink-0" />
                    <span className="font-mono text-xs truncate">{review}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}
