'use client';

import React, { useState, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Clock, Globe, Bell, BellOff, Filter, Loader2,
  ChevronRight, ExternalLink, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const platforms = [
  { id: 'codeforces', name: 'Codeforces', color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 'codechef', name: 'CodeChef', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'leetcode', name: 'LeetCode', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'atcoder', name: 'AtCoder', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'hackerrank', name: 'HackerRank', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
];

const mockContests = [
  { id: '1', title: 'Codeforces Round #950', platform: 'codeforces', date: '2026-07-05', time: '14:00 UTC', duration: '2h 15m', type: 'Individual', url: '#' },
  { id: '2', title: 'LeetCode Weekly Contest 420', platform: 'leetcode', date: '2026-07-06', time: '02:30 UTC', duration: '1h 30m', type: 'Individual', url: '#' },
  { id: '3', title: 'AtCoder Beginner Contest 350', platform: 'atcoder', date: '2026-07-07', time: '12:00 UTC', duration: '1h 40m', type: 'Individual', url: '#' },
  { id: '4', title: 'CodeChef Starters 180', platform: 'codechef', date: '2026-07-08', time: '14:30 UTC', duration: '2h', type: 'Individual', url: '#' },
  { id: '5', title: 'Codeforces Round #951', platform: 'codeforces', date: '2026-07-10', time: '14:00 UTC', duration: '2h 15m', type: 'Individual', url: '#' },
  { id: '6', title: 'HackerRank Week of Code', platform: 'hackerrank', date: '2026-07-11', time: '00:00 UTC', duration: '7 days', type: 'Individual', url: '#' },
  { id: '7', title: 'LeetCode Biweekly Contest 150', platform: 'leetcode', date: '2026-07-12', time: '02:30 UTC', duration: '1h 30m', type: 'Individual', url: '#' },
  { id: '8', title: 'AtCoder Regular Contest 185', platform: 'atcoder', date: '2026-06-28', time: '12:00 UTC', duration: '2h', type: 'Individual', url: '#' },
  { id: '9', title: 'CodeChef Cook-Off 150', platform: 'codechef', date: '2026-06-25', time: '14:30 UTC', duration: '2h 30m', type: 'Team', url: '#' },
  { id: '10', title: 'Codeforces Round #948', platform: 'codeforces', date: '2026-06-20', time: '14:00 UTC', duration: '2h', type: 'Individual', url: '#' },
];

export default function ContestCalendarPage() {
  const [tab, setTab] = useState('upcoming');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [reminders, setReminders] = useState<Set<string>>(new Set());

  const today = '2026-07-02';

  const filtered = useMemo(() => {
    let items = [...mockContests];
    if (tab === 'upcoming') items = items.filter(c => c.date >= today);
    else items = items.filter(c => c.date < today);
    if (platformFilter !== 'All') items = items.filter(c => c.platform === platformFilter);
    items.sort((a, b) => a.date.localeCompare(b.date));
    return items;
  }, [tab, platformFilter]);

  const toggleReminder = (id: string) => {
    setReminders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getPlatformInfo = (id: string) => platforms.find(p => p.id === id);

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            CONTEST <span className="text-primary neon-text">CALENDAR</span>
          </h1>
          <p className="text-muted-foreground">Track upcoming coding contests from major platforms.</p>
        </div>

        <Tabs defaultValue="upcoming" onValueChange={setTab}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Button key="all" variant={platformFilter === 'All' ? 'default' : 'outline'} size="sm" onClick={() => setPlatformFilter('All')} className="text-xs font-bold uppercase tracking-widest">
            All
          </Button>
          {platforms.map(p => (
            <Button key={p.id} variant={platformFilter === p.id ? 'default' : 'outline'} size="sm" onClick={() => setPlatformFilter(p.id)} className="text-xs font-bold uppercase tracking-widest gap-1.5">
              <Globe className={cn('w-3 h-3', p.color)} />
              {p.name}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((contest, i) => {
            const platform = getPlatformInfo(contest.platform);
            const hasReminder = reminders.has(contest.id);
            return (
              <motion.div key={contest.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="bg-card/50 border-border hover:border-primary/30 transition-all group">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', platform?.bg)}>
                          <Globe className={cn('w-5 h-5', platform?.color)} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold truncate">{contest.title}</h3>
                            <Badge variant="outline" className="text-[8px] uppercase tracking-widest bg-muted/50">
                              {contest.type}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className={cn('font-bold', platform?.color)}>{platform?.name}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {contest.date}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {contest.time}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {contest.duration}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReminder(contest.id)}
                          className={cn(hasReminder ? 'text-primary' : 'text-muted-foreground')}
                        >
                          {hasReminder ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                          <a href={contest.url} target="_blank" rel="noopener noreferrer">
                            Visit <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-bold">No Contests Found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your platform filter.</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
