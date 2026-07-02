'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Filter, Globe, Loader2,
} from 'lucide-react';

const platforms = [
  { id: 'codeforces', name: 'Codeforces', color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 'codechef', name: 'CodeChef', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'leetcode', name: 'LeetCode', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'atcoder', name: 'AtCoder', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'hackerrank', name: 'HackerRank', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
];

export default function ContestCalendarPage() {
  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            CONTEST <span className="text-primary neon-text">CALENDAR</span>
          </h1>
          <p className="text-muted-foreground">Track upcoming coding contests from major platforms.</p>
        </div>

        <Tabs defaultValue="upcoming">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">All</span>
          {platforms.map(p => (
            <span key={p.id} className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Globe className={`w-3 h-3 ${p.color}`} />
              {p.name}
            </span>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="w-12 h-12 text-muted-foreground/30 mb-4 animate-spin" />
          <p className="text-muted-foreground font-bold">No contests loaded</p>
          <p className="text-xs text-muted-foreground mt-1">Contest data will appear here once connected.</p>
        </div>
      </div>
    </Shell>
  );
}
