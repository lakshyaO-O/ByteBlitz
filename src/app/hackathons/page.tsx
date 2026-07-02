'use client';

import React, { useState, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar, Clock, Trophy, Users, MapPin, Filter, Loader2,
  ChevronRight, Star, Sparkles, Target, Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const categories = ['All', 'Web3', 'AI/ML', 'Mobile', 'DevTools', 'Open Source', 'Design', 'Hardware'];
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const mockHackathons = [
  {
    id: '1', title: 'Build the Future Hackathon', tagline: 'Build innovative solutions for tomorrow\'s challenges.',
    startDate: '2026-07-15', endDate: '2026-07-17', prizePool: '$50,000', organizer: 'DevRann',
    participants: 1200, difficulty: 'Intermediate', category: 'AI/ML', status: 'upcoming', featured: true,
    image: null,
  },
  {
    id: '2', title: 'Web3 Revolution', tagline: 'Decentralized apps for the next generation of the internet.',
    startDate: '2026-07-20', endDate: '2026-07-30', prizePool: '$25,000', organizer: 'Chain Labs',
    participants: 850, difficulty: 'Advanced', category: 'Web3', status: 'upcoming', featured: false,
    image: null,
  },
  {
    id: '3', title: 'AI for Good', tagline: 'Use artificial intelligence to solve real-world problems.',
    startDate: '2026-06-01', endDate: '2026-06-30', prizePool: '$100,000', organizer: 'Google',
    participants: 5400, difficulty: 'Intermediate', category: 'AI/ML', status: 'active', featured: true,
    image: null,
  },
  {
    id: '4', title: 'Mobile App Challenge', tagline: 'Create the next great mobile experience.',
    startDate: '2026-05-01', endDate: '2026-05-21', prizePool: '$15,000', organizer: 'Apple',
    participants: 2300, difficulty: 'Beginner', category: 'Mobile', status: 'past', featured: false,
    image: null,
  },
  {
    id: '5', title: 'Open Source Sprint', tagline: 'Contribute to open source projects and win prizes.',
    startDate: '2026-06-10', endDate: '2026-06-14', prizePool: '$10,000', organizer: 'GitHub',
    participants: 1800, difficulty: 'Beginner', category: 'Open Source', status: 'active', featured: false,
    image: null,
  },
  {
    id: '6', title: 'DevTools Hackathon', tagline: 'Build tools that make developers\' lives easier.',
    startDate: '2026-08-01', endDate: '2026-08-07', prizePool: '$30,000', organizer: 'Vercel',
    participants: 950, difficulty: 'Advanced', category: 'DevTools', status: 'upcoming', featured: false,
    image: null,
  },
];

export default function HackathonsPage() {
  const [tab, setTab] = useState('upcoming');
  const [catFilter, setCatFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');

  const filtered = useMemo(() => {
    let items = [...mockHackathons];
    if (tab === 'upcoming') items = items.filter(h => h.status === 'upcoming');
    else if (tab === 'active') items = items.filter(h => h.status === 'active');
    else items = items.filter(h => h.status === 'past');
    if (catFilter !== 'All') items = items.filter(h => h.category === catFilter);
    if (diffFilter !== 'All') items = items.filter(h => h.difficulty === diffFilter);
    return items;
  }, [tab, catFilter, diffFilter]);

  const featured = mockHackathons.find(h => h.featured && h.status !== 'past');

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            HACK<span className="text-primary neon-text">ATHONS</span>
          </h1>
          <p className="text-muted-foreground">Compete in hackathons, build amazing projects, and win prizes.</p>
        </div>

        {featured && (
          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] uppercase tracking-widest">Featured</Badge>
                  </div>
                  <h2 className="text-3xl font-headline font-bold">{featured.title}</h2>
                  <p className="text-muted-foreground max-w-xl">{featured.tagline}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-orange-400" /> {featured.prizePool}</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {featured.participants.toLocaleString()} participants</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {featured.startDate} - {featured.endDate}</span>
                    <Badge variant="outline" className={cn(
                      'text-[10px] uppercase tracking-widest',
                      featured.difficulty === 'Beginner' ? 'text-emerald-400 border-emerald-400/30' :
                      featured.difficulty === 'Intermediate' ? 'text-yellow-400 border-yellow-400/30' :
                      'text-destructive border-destructive/30'
                    )}>{featured.difficulty}</Badge>
                  </div>
                </div>
                <Button size="lg" className="gap-2 shrink-0">Register Now <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="upcoming" onValueChange={setTab}>
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
              <Button key={cat} variant={catFilter === cat ? 'default' : 'outline'} size="sm" onClick={() => setCatFilter(cat)} className="text-xs font-bold uppercase tracking-widest">
                {cat}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {difficulties.map(d => (
              <Button key={d} variant={diffFilter === d ? 'secondary' : 'ghost'} size="sm" onClick={() => setDiffFilter(d)} className="text-xs font-bold uppercase tracking-widest">
                {d}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((hack, i) => (
            <motion.div key={hack.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-card/50 border-border hover:border-primary/30 transition-all group h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-muted/50">{hack.category}</Badge>
                    <Badge variant="outline" className={cn(
                      'text-[9px] uppercase tracking-widest',
                      hack.difficulty === 'Beginner' ? 'text-emerald-400 border-emerald-400/30' :
                      hack.difficulty === 'Intermediate' ? 'text-yellow-400 border-yellow-400/30' :
                      'text-destructive border-destructive/30'
                    )}>{hack.difficulty}</Badge>
                  </div>
                  <h3 className="font-headline font-bold text-lg group-hover:text-primary transition-colors">{hack.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">{hack.tagline}</p>
                  <div className="space-y-1.5 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Trophy className="w-3 h-3 text-orange-400" /> {hack.prizePool}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {hack.participants.toLocaleString()} participants</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {hack.startDate} - {hack.endDate}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {hack.organizer}</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <Button className="w-full gap-2" size="sm">
                      {hack.status === 'past' ? 'View Results' : 'Register'} <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
