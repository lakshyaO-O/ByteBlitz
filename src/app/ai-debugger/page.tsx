'use client';

import React, { useState, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bug, Loader2, AlertTriangle, CheckCircle2, Lightbulb,
  Shield, Target, ArrowRight, FileCode, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useAiUsage } from '@/hooks/use-ai-usage';
import { useToast } from '@/hooks/use-toast';
import { UsageCard } from '@/components/ai/UsageCard';
import { PremiumUpgradeModal } from '@/components/ai/PremiumUpgradeModal';

interface DebugResult {
  errorType: string;
  rootCause: string;
  explanation: string;
  fix: string;
  prevention: string;
  fixedCode?: string;
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

export default function AIDebuggerPage() {
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [errorMessage, setErrorMessage] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { isExhausted, isPremium, loading: usageLoading, consume } = useAiUsage(user?.uid || null, 'aiDebugger');

  const handleDebug = useCallback(async () => {
    if (!code.trim() || isLoading || usageLoading) return;

    if (isExhausted && !isPremium) {
      setShowUpgrade(true);
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/debugger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          errorMessage: errorMessage.trim(),
          expectedBehavior: expectedBehavior.trim(),
        }),
      });

      if (!res.ok) throw new Error('Debug request failed');

      const data = await res.json();
      const parsed: DebugResult = typeof data.response === 'string'
        ? JSON.parse(data.response)
        : data.response || data;

      setResult(parsed);

      if (user) {
        await consume();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to debug. Try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [code, language, errorMessage, expectedBehavior, isLoading, usageLoading, isExhausted, isPremium, user, consume, toast]);

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
              AI Debugger
            </h1>
            <p className="text-sm text-muted-foreground">Find and fix bugs with AI-powered analysis.</p>
          </div>
          <UsageCard
            userId={user?.uid || null}
            feature="aiDebugger"
            onUpgrade={() => setShowUpgrade(true)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-primary" /> Code to Debug
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
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
                  className="min-h-[200px] font-mono text-sm resize-y"
                />
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" /> Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Error Message</label>
                  <Input
                    placeholder="e.g. Cannot read property 'map' of undefined"
                    value={errorMessage}
                    onChange={(e) => setErrorMessage(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Expected Behavior</label>
                  <Input
                    placeholder="e.g. Should display a list of users"
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleDebug}
                  disabled={!code.trim() || isLoading || (isExhausted && !isPremium)}
                  className="w-full gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
                  {isLoading ? 'Analyzing...' : 'Debug Code'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bug className="w-4 h-4 text-primary" /> Analysis Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 rounded bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : result ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-3 rounded bg-destructive/5 border border-destructive/20">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-destructive">Error Type</p>
                      <p className="text-sm font-medium">{result.errorType}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Root Cause
                    </p>
                    <p className="text-sm p-3 rounded bg-muted/30 border border-border/50">{result.rootCause}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-yellow-400" /> Explanation
                    </p>
                    <p className="text-sm p-3 rounded bg-muted/30 border border-border/50">{result.explanation}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> The Fix
                    </p>
                    <p className="text-sm p-3 rounded bg-emerald-500/5 border border-emerald-500/20">{result.fix}</p>
                    {result.fixedCode && (
                      <pre className="mt-2 p-3 rounded bg-background/80 border border-border overflow-x-auto text-xs font-mono">
                        <code>{result.fixedCode}</code>
                      </pre>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-blue-400 mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Prevention
                    </p>
                    <p className="text-sm p-3 rounded bg-blue-500/5 border border-blue-500/20">{result.prevention}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <Bug className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No analysis yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Submit your code to get AI-powered debugging help.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PremiumUpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="aiDebugger"
      />
    </Shell>
  );
}
