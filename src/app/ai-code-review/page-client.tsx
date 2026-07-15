'use client';

import React, { useState, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Code2, Loader2, Clock, CheckCircle2, AlertTriangle,
  Lightbulb, ArrowRight, ChevronRight, MessageSquare, ThumbsUp,
  FileCode, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useAiUsage } from '@/hooks/use-ai-usage';
import { useToast } from '@/hooks/use-toast';
import { UsageCard } from '@/components/ai/UsageCard';
import { PremiumUpgradeModal } from '@/components/ai/PremiumUpgradeModal';

interface ReviewIssue {
  line: number;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  suggestion: string;
}

interface ReviewFeedback {
  summary: string;
  strengths: string[];
  issues: ReviewIssue[];
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
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<ReviewFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentReviews, setRecentReviews] = useState<string[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { isExhausted, isPremium, loading: usageLoading, consume } = useAiUsage(user?.uid || null, 'aiCodeReview');

  const handleSubmit = useCallback(async () => {
    if (!code.trim() || isLoading || usageLoading) return;

    if (isExhausted && !isPremium) {
      setShowUpgrade(true);
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const token = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      const res = await fetch('/api/ai/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || `Request failed (${res.status})`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const parsed: ReviewFeedback = {
        summary: data.summary || '',
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        issues: Array.isArray(data.issues) ? data.issues : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        score: typeof data.score === 'number' ? data.score : 0,
      };

      setFeedback(parsed);
      setRecentReviews((prev) => [code.slice(0, 80) + '...', ...prev].slice(0, 5));

      if (user) {
        await consume();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to review code. Try again.';
      setError(message);
      if (process.env.NODE_ENV === 'development') {
        console.error('Code review error:', err);
      }
      toast({ title: 'Review Failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [code, language, isLoading, usageLoading, isExhausted, isPremium, user, consume, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold text-foreground">
              AI Code Review
            </h1>
            <p className="text-sm text-muted-foreground">Get instant feedback on your code quality and best practices.</p>
          </div>
          <UsageCard
            userId={user?.uid || null}
            feature="aiCodeReview"
            onUpgrade={() => setShowUpgrade(true)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" /> Your Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
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
                className="min-h-[300px] font-mono text-sm resize-y"
              />
              <Button
                onClick={handleSubmit}
                disabled={!code.trim() || isLoading || (isExhausted && !isPremium)}
                className="w-full gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
                {isLoading ? 'Reviewing...' : 'Review Code'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analyzing your code with AI...</span>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                  <AlertTriangle className="w-10 h-10 text-destructive/60 mb-2" />
                  <p className="text-sm font-medium text-destructive">Review Failed</p>
                  <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSubmit}
                    className="gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </Button>
                </div>
              ) : feedback ? (
                <ScrollArea className="h-[400px] pr-2">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-base font-bold',
                        feedback.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                        feedback.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-destructive/20 text-destructive'
                      )}>
                        {feedback.score}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Code Quality Score</p>
                        <p className="text-xs text-muted-foreground">
                          {feedback.score >= 80 ? 'Great job!' : feedback.score >= 50 ? 'Needs improvement' : 'Major issues'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                      <p className="text-sm">{feedback.summary}</p>
                    </div>

                    {feedback.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1">
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
                        <p className="text-xs font-medium text-destructive mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Issues
                        </p>
                        <ul className="space-y-2">
                          {feedback.issues.map((issue, i) => (
                            <li key={i} className="text-sm p-3 rounded bg-muted/30 border border-border/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={issue.severity === 'critical' ? 'destructive' : issue.severity === 'warning' ? 'default' : 'secondary'} className="text-xs">
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
                        <p className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-1">
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
                  <Code2 className="w-10 h-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No review yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Submit your code to get AI-powered feedback.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {recentReviews.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Recent Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentReviews.map((review, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded hover:bg-muted/30 transition-colors cursor-pointer">
                    <ChevronRight className="w-3 h-3 shrink-0" />
                    <span className="font-mono text-xs truncate">{review}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <PremiumUpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="aiCodeReview"
      />
    </Shell>
  );
}
