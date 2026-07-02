'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Trophy, Filter,
  Loader2,
} from 'lucide-react';

const categories = ['All', 'Web3', 'AI/ML', 'Mobile', 'DevTools', 'Open Source', 'Design', 'Hardware'];
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function HackathonsPage() {
  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            HACK<span className="text-primary neon-text">ATHONS</span>
          </h1>
          <p className="text-muted-foreground">Compete in hackathons, build amazing projects, and win prizes.</p>
        </div>

        <Tabs defaultValue="upcoming">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {categories.map(cat => (
              <Button key={cat} variant="outline" size="sm" className="text-xs font-bold uppercase tracking-widest">
                {cat}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {difficulties.map(d => (
              <Button key={d} variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest">
                {d}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="w-12 h-12 text-muted-foreground/30 mb-4 animate-spin" />
          <p className="text-muted-foreground font-bold">No hackathons available yet</p>
          <p className="text-xs text-muted-foreground mt-1">Check back later for upcoming hackathons.</p>
        </div>
      </div>
    </Shell>
  );
}
