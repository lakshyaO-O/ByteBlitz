'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Bug, Loader2, Zap, Crown, AlertTriangle, CheckCircle2, Lightbulb,
  Shield, Target, ArrowRight, FileCode, Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { checkAILimit, incrementAILimit } from '@/services/ai-usage';
import { toast } from '@/hooks/use-toast';

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
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [errorMessage, setErrorMessage] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [usage, setUsage] = useState<{ remaining: number; limit: number } | null>(null);

  useEffect(() => {
    if (user) {
      checkAILimit(user.uid, 'debugger').then((r) => {
        setUsage({ remaining: r.remaining, limit: r.limit });
      });
    }
  }, [user]);

  const handleDebug = async () => {
    if (!code.trim() || isLoading) return;

    if (usage && usage.remaining <= 0) {
      toast({ title: 'Daily limit reached', description: 'Upgrade to Pro for more debugging sessions.', variant: 'destructive' });
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
        await incrementAILimit(user.uid, 'debugger');
        const updated = await checkAILimit(user.uid, 'debugger');
        setUsage({ remaining: updated.remaining, limit: updated.limit });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to debug. Try again.', variant: 'destructive' });
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
              AI <span className="text-primary">Debugger</span>
            </h1>
            <p className="text-muted-foreground text-sm">Find and fix bugs with AI-powered analysis.</p>
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
              <p className="text-sm flex-1 font-bold">Daily debug limit reached.</p>
              <Button variant="default" size="sm" className="gap-1.5"><Crown className="w-4 h-4" /> Upgrade</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-primary" /> Code to Debug
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-muted/30 border-border">
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
                  className="min-h-[200px] font-mono text-sm bg-muted/30 border-border resize-y"
                />
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" /> Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Error Message</label>
                  <Input
                    placeholder="e.g. Cannot read property 'map' of undefined"
                    value={errorMessage}
                    onChange={(e) => setErrorMessage(e.target.value)}
                    className="bg-muted/30 border-border"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Expected Behavior</label>
                  <Input
                    placeholder="e.g. Should display a list of users"
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    className="bg-muted/30 border-border"
                  />
                </div>
                <Button
                  onClick={handleDebug}
                  disabled={!code.trim() || isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
                  {isLoading ? 'Analyzing...' : 'Debug Code'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                <Bug className="w-4 h-4 text-primary" /> Analysis Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : result ? (
                <div className="space-y-5">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-destructive">Error Type</p>
                      <p className="text-sm font-bold">{result.errorType}</p>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Root Cause
                    </p>
                    <p className="text-sm p-3 rounded-lg bg-muted/30 border border-border/50">{result.rootCause}</p>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-yellow-400" /> Explanation
                    </p>
                    <p className="text-sm p-3 rounded-lg bg-muted/30 border border-border/50">{result.explanation}</p>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> The Fix
                    </p>
                    <p className="text-sm p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">{result.fix}</p>
                    {result.fixedCode && (
                      <pre className="mt-2 p-3 rounded-lg bg-background/80 border border-border overflow-x-auto text-xs font-mono">
                        <code>{result.fixedCode}</code>
                      </pre>
                    )}
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Prevention
                    </p>
                    <p className="text-sm p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">{result.prevention}</p>
                  </motion.div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <Bug className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-bold">No analysis yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Submit your code to get AI-powered debugging help.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
