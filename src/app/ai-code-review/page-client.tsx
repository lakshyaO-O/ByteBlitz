'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Code2, Loader2, Clock, AlertTriangle,
  ChevronRight, MessageSquare, Check, Copy,
  FileCode, RefreshCw, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useAiUsage } from '@/hooks/use-ai-usage';
import { useToast } from '@/hooks/use-toast';
import { UsageCard } from '@/components/ai/UsageCard';
import { PremiumUpgradeModal } from '@/components/ai/PremiumUpgradeModal';
import { ThinkingIndicator } from '@/components/ai/ThinkingIndicator';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

const CATEGORIES = [
  { key: 'correctness', label: 'Correctness' },
  { key: 'readability', label: 'Readability' },
  { key: 'performance', label: 'Performance' },
  { key: 'security', label: 'Security' },
  { key: 'maintainability', label: 'Maintainability' },
  { key: 'bestPractices', label: 'Best Practices' },
] as const;

interface CategoryScores {
  correctness: number;
  readability: number;
  performance: number;
  security: number;
  maintainability: number;
  bestPractices: number;
}

interface ReviewFeedback {
  review: string;
  score: number;
  categoryScores: CategoryScores;
}

// ---- Code Block ----

function CodeBlock({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { className?: string }) {
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children || '').replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code]);

  if (match) {
    return (
      <div className="group relative my-4 rounded-xl overflow-hidden border border-border/40 bg-[#0d1117] shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#21262d] text-xs font-medium text-[#8b949e]">
            <FileCode className="w-3 h-3" />
            {match[1]}
          </span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-all duration-150"
            aria-label="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="overflow-x-auto">
          <pre className="p-4 text-sm leading-relaxed">
            <code className={className} {...props}>{children}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <code className="px-1.5 py-0.5 rounded-md bg-muted/60 text-sm font-mono text-foreground border border-border/30" {...props}>
      {children}
    </code>
  );
}

// ---- Score Bars ----

function ScoreBars({ scores }: { scores: CategoryScores }) {
  const maxScore = 10;

  return (
    <div className="space-y-2.5">
      {CATEGORIES.map(({ key, label }) => {
        const val = Math.max(0, Math.min(maxScore, scores[key as keyof CategoryScores]));
        const pct = (val / maxScore) * 100;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-28 text-xs font-medium text-muted-foreground shrink-0 text-right">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out',
                  val >= 8 ? 'bg-emerald-500' : val >= 5 ? 'bg-yellow-500' : 'bg-destructive'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={cn(
              'w-8 text-xs font-bold shrink-0 text-right',
              val >= 8 ? 'text-emerald-400' : val >= 5 ? 'text-yellow-400' : 'text-destructive'
            )}>
              {val}/10
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---- Overall Score Badge ----

function OverallScore({ score, categoryScores }: { score: number; categoryScores: CategoryScores }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-muted/20 border border-border/40">
      <div className="flex items-center gap-3 shrink-0">
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold',
          score >= 80 ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' :
          score >= 50 ? 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30' :
          'bg-destructive/15 text-destructive ring-1 ring-destructive/30'
        )}>
          {score}
        </div>
        <div>
          <p className="font-semibold text-sm">Overall Quality</p>
          <p className="text-xs text-muted-foreground">
            {score >= 80 ? 'Great work!' : score >= 50 ? 'Needs improvement' : 'Major issues'}
          </p>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <ScoreBars scores={categoryScores} />
      </div>
    </div>
  );
}

// ---- Confidence Badge ----

const CONFIDENCE_PATTERN = /(?:AI Confidence|Confidence)[:\s]*(🟢|🟡|🔵)\s*(High|Medium|Low)?/i;

function ConfidenceBadge({ review }: { review: string }) {
  const match = review.match(CONFIDENCE_PATTERN);
  if (!match) return null;

  const dot = match[1];
  const level = match[2] || (dot === '🟢' ? 'High' : dot === '🟡' ? 'Medium' : 'Low');

  const conf = dot === '🟢' ? 'high' : dot === '🟡' ? 'medium' : 'low';

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border',
      conf === 'high' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      conf === 'medium' && 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      conf === 'low' && 'bg-destructive/10 text-destructive border-destructive/20',
    )}>
      <span className="text-base leading-none">{dot}</span>
      <span className="font-semibold">{level} Confidence</span>
    </div>
  );
}

// ---- Divider ----

function SectionDivider() {
  return <hr className="my-6 border-border/40" />;
}

// ---- Markdown Review ----

const LIST_PATTERN = /^☐\s(.+)$/m;

function MarkdownReview({ content }: { content: string }) {
  const components = useMemo(() => ({
    code: CodeBlock,
    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    hr: () => <SectionDivider />,
    h1: ({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) => (
      <h1 className="text-xl font-bold text-foreground mt-6 mb-3 flex items-center gap-2" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
      <h2 className="text-lg font-semibold text-foreground mt-5 mb-2 flex items-center gap-2" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
      <h3 className="text-base font-semibold text-primary mt-4 mb-2" {...props}>
        {children}
      </h3>
    ),
    ul: ({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) => {
      const hasChecklist = React.Children.toArray(children).some(
        (child: any) => child?.props?.children?.[0]?.props?.children?.[0] === '☐'
      );
      if (hasChecklist) {
        return <ul className="space-y-1.5 not-prose" {...props}>{children}</ul>;
      }
      return <ul className="space-y-1 text-sm text-muted-foreground pl-4 list-disc [&>li]:marker:text-muted-foreground/50" {...props}>{children}</ul>;
    },
    li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => {
      const firstChild = React.Children.toArray(children)[0];
      const text = typeof firstChild === 'string' ? firstChild : '';
      if (text.startsWith('☐')) {
        const label = text.replace('☐', '').trim();
        return (
          <li className="flex items-start gap-2 text-sm" {...props}>
            <span className="w-4 h-4 mt-0.5 rounded border-2 border-muted-foreground/40 shrink-0 inline-flex items-center justify-center" />
            <span className="text-foreground/80">{label}</span>
          </li>
        );
      }
      return <li className="text-sm text-muted-foreground/90" {...props}>{children}</li>;
    },
    p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => {
      const text = typeof children === 'string' ? children : '';
      if (text.startsWith('🟢') || text.startsWith('🟡') || text.startsWith('🔵')) {
        return <ConfidenceBadge review={text} />;
      }
      return <p className="text-sm text-muted-foreground/90 leading-relaxed" {...props}>{children}</p>;
    },
    strong: ({ children, ...props }: React.ComponentPropsWithoutRef<'strong'>) => (
      <strong className="font-semibold text-foreground" {...props}>{children}</strong>
    ),
  }), []);

  return (
    <div className="prose prose-invert max-w-none prose-sm prose-headings:font-bold prose-headings:text-foreground prose-a:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-none">
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ---- Language Options ----

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

// ---- Main Page ----

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

      const defaultCat = { correctness: 0, readability: 0, performance: 0, security: 0, maintainability: 0, bestPractices: 0 };

      const parsed: ReviewFeedback = {
        review: data.review || '',
        score: typeof data.score === 'number' ? data.score : 0,
        categoryScores: data.categoryScores || defaultCat,
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
      <div className="space-y-6 max-w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold text-foreground">
              AI Code Review
            </h1>
            <p className="text-sm text-muted-foreground">Instant AI-powered code quality analysis.</p>
          </div>
          <UsageCard
            userId={user?.uid || null}
            feature="aiCodeReview"
            onUpgrade={() => setShowUpgrade(true)}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-border h-fit">
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
                placeholder="Paste your code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[280px] font-mono text-sm resize-y"
              />
              <Button
                onClick={handleSubmit}
                disabled={!code.trim() || isLoading || (isExhausted && !isPremium)}
                className="w-full gap-2 h-10"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
                {isLoading ? 'Analyzing...' : 'Review Code'}
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
                  <ThinkingIndicator text="Analyzing code" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-muted/40 skeleton-shimmer" />
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                  <AlertTriangle className="w-10 h-10 text-destructive/60" />
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
                <ScrollArea className="h-[500px] xl:h-[600px] pr-2">
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
                    <OverallScore score={feedback.score} categoryScores={feedback.categoryScores} />
                    <div className="border-t border-border/30 pt-4">
                      <MarkdownReview content={feedback.review} />
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                    <Code2 className="w-7 h-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No review yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
                    Paste your code on the left and click Review Code.
                  </p>
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
              <div className="space-y-1">
                {recentReviews.map((review, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/40" />
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
