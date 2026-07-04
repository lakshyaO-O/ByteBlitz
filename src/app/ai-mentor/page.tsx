'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Send, Bot, User, Sparkles, Zap, Loader2, Crown, Code2,
  Hash, BookOpen, Cpu, Globe, Database,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useAiUsage } from '@/hooks/use-ai-usage';
import { UsageDisplay } from '@/components/ai/UsageDisplay';
import { PremiumUpgradeModal } from '@/components/ai/PremiumUpgradeModal';
import { toast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

const TOPICS = [
  { label: 'DSA', icon: Hash },
  { label: 'Web Dev', icon: Globe },
  { label: 'Python', icon: Code2 },
  { label: 'System Design', icon: Cpu },
  { label: 'SQL', icon: Database },
  { label: 'React', icon: BookOpen },
];

export default function AIMentorPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI mentor. Ask me anything about coding, DSA, system design, or career advice. What would you like to learn today?",
      id: 'welcome',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { remaining, isExhausted, isPremium, refresh, consume } = useAiUsage(user?.uid || null, 'aiMentor');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (isExhausted && !isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: text, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (user) {
        const allowed = await consume();
        if (!allowed) {
          setShowUpgradeModal(true);
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          context: JSON.stringify(messages.slice(-10).map(m => `${m.role}: ${m.content}`)),
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.answer || data.response || data.message || 'No response',
        id: (Date.now() + 1).toString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      refresh();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTopicClick = (topic: string) => {
    setInput(`Teach me about ${topic}`);
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
              AI <span className="text-primary">Mentor</span>
            </h1>
            <p className="text-muted-foreground text-sm">Your personal coding assistant — ask anything.</p>
          </div>
          <div className="flex items-center gap-3">
            <UsageDisplay
              userId={user?.uid || null}
              feature="aiMentor"
              showLabel={false}
              showProgressBar={false}
              showCountdown
            />
          </div>
        </div>

        <Card className="bg-card/50 border-border overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'flex gap-3 max-w-[85%]',
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1',
                        msg.role === 'user' ? 'bg-primary/20' : 'bg-secondary/20'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Bot className="w-4 h-4 text-secondary" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-md'
                          : 'bg-muted/50 border border-border/50 rounded-tl-md'
                      )}
                    >
                      {msg.content.split('```').map((part, i) =>
                        i % 2 === 0 ? (
                          <span key={i}>{part}</span>
                        ) : (
                          <pre
                            key={i}
                            className="my-2 p-3 rounded-lg bg-background/80 border border-border overflow-x-auto text-xs font-mono"
                          >
                            <code>{part}</code>
                          </pre>
                        )
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 max-w-[85%]"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-muted/50 border border-border/50 rounded-tl-md">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator />

          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleTopicClick(topic.label)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50 text-[11px] font-medium uppercase tracking-wider hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <topic.icon className="w-3 h-3" />
                  {topic.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ask anything about coding..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="bg-muted/30 border-border"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <PremiumUpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="aiMentor"
      />
    </Shell>
  );
}
