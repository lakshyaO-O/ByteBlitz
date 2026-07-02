'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Clock, Trophy, Users, MapPin, ArrowLeft, ChevronRight,
  Target, Medal, Gift, Star, Sparkles, CheckCircle2, UserPlus,
  Loader2, Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mockHackathon = {
  id: '1', title: 'Build the Future Hackathon', tagline: 'Build innovative solutions for tomorrow\'s challenges.',
  description: 'Join us for an intense 48-hour hackathon where you\'ll build innovative solutions using cutting-edge technologies. Work in teams of 2-4 to create a project from scratch. Mentors from top tech companies will be available to guide you.',
  rules: [
    'Teams of 2-4 members',
    'All code must be written during the event',
    'Use of open-source libraries is allowed',
    'Projects must be original and not previously submitted',
    'Final submission must include source code and a demo video',
  ],
  judgingCriteria: [
    { name: 'Innovation', weight: 25, description: 'How novel is the solution?' },
    { name: 'Technical Complexity', weight: 25, description: 'Depth of technical implementation' },
    { name: 'Design & UX', weight: 20, description: 'User interface and experience quality' },
    { name: 'Impact', weight: 20, description: 'Potential real-world impact' },
    { name: 'Presentation', weight: 10, description: 'Quality of demo and pitch' },
  ],
  prizes: [
    { place: '1st Place', reward: '$25,000 + Mentorship', icon: Trophy, color: 'text-yellow-400' },
    { place: '2nd Place', reward: '$15,000 + Swag Pack', icon: Medal, color: 'text-gray-300' },
    { place: '3rd Place', reward: '$10,000 + Swag Pack', icon: Medal, color: 'text-orange-400' },
    { place: 'Best Solo', reward: '$5,000', icon: Star, color: 'text-primary' },
  ],
  sponsors: ['Google', 'Vercel', 'GitHub', 'Cloudflare'],
  startDate: '2026-07-15', endDate: '2026-07-17',
  prizePool: '$50,000', organizer: 'DevRann', organizerAvatar: '',
  participants: 1200, difficulty: 'Intermediate', category: 'AI/ML',
  status: 'upcoming', featured: true,
  schedule: [
    { time: 'Day 1 - 09:00', event: 'Opening Ceremony & Theme Reveal' },
    { time: 'Day 1 - 10:00', event: 'Hacking Begins' },
    { time: 'Day 1 - 14:00', event: 'Workshop: API Integration' },
    { time: 'Day 2 - 10:00', event: 'Mid-point Check-in' },
    { time: 'Day 2 - 16:00', event: 'Submission Deadline' },
    { time: 'Day 2 - 18:00', event: 'Presentations & Judging' },
    { time: 'Day 2 - 20:00', event: 'Awards Ceremony' },
  ],
  leaderboard: [
    { rank: 1, team: 'Code Wizards', project: 'EcoTrack', score: 92 },
    { rank: 2, team: 'Byte Brigade', project: 'HealthHub', score: 88 },
    { rank: 3, team: 'Dev Dragons', project: 'LearnChain', score: 85 },
  ],
};

export default function HackathonDetailPage() {
  const params = useParams();
  const h = mockHackathon;
  const [registered, setRegistered] = useState(false);

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
          <Link href="/hackathons"><ArrowLeft className="w-4 h-4" /> Back to Hackathons</Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-muted/50">{h.category}</Badge>
                <Badge variant="outline" className={cn(
                  'text-[10px] uppercase tracking-widest',
                  h.difficulty === 'Beginner' ? 'text-emerald-400 border-emerald-400/30' :
                  h.difficulty === 'Intermediate' ? 'text-yellow-400 border-yellow-400/30' :
                  'text-destructive border-destructive/30'
                )}>{h.difficulty}</Badge>
                <Badge className={cn(
                  'text-[10px] uppercase tracking-widest',
                  h.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  h.status === 'upcoming' ? 'bg-primary/10 text-primary border-primary/30' :
                  'bg-muted text-muted-foreground border-border'
                )}>{h.status}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-headline font-bold">{h.title}</h1>
              <p className="text-muted-foreground mt-2 text-lg">{h.tagline}</p>
            </div>

            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-5 gap-2 h-auto bg-muted/50 p-1">
                <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                <TabsTrigger value="rules" className="text-xs">Rules</TabsTrigger>
                <TabsTrigger value="judging" className="text-xs">Judging</TabsTrigger>
                <TabsTrigger value="prizes" className="text-xs">Prizes</TabsTrigger>
                <TabsTrigger value="sponsors" className="text-xs">Sponsors</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-6">
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-6">
                    <h3 className="font-headline font-bold mb-3">About</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{h.description}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                  <CardHeader><CardTitle className="text-sm font-headline font-bold">Timeline</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {h.schedule.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div className="min-w-[130px] font-mono text-xs text-muted-foreground">{item.time}</div>
                          <div className="w-2 h-2 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                          <div>{item.event}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules" className="mt-4">
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-6">
                    <h3 className="font-headline font-bold mb-4">Rules & Guidelines</h3>
                    <ul className="space-y-3">
                      {h.rules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="judging" className="mt-4">
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-6">
                    <h3 className="font-headline font-bold mb-4">Judging Criteria</h3>
                    <div className="space-y-4">
                      {h.judgingCriteria.map((criterion, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold">{criterion.name}</span>
                            <span className="text-muted-foreground">{criterion.weight}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${criterion.weight}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{criterion.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prizes" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {h.prizes.map((prize, i) => (
                    <Card key={i} className="bg-card/50 border-border">
                      <CardContent className="p-6 text-center space-y-2">
                        <prize.icon className={cn('w-8 h-8 mx-auto', prize.color)} />
                        <h4 className="font-headline font-bold">{prize.place}</h4>
                        <p className="text-sm text-muted-foreground">{prize.reward}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="sponsors" className="mt-4">
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-6">
                    <h3 className="font-headline font-bold mb-4">Sponsors</h3>
                    <div className="flex flex-wrap gap-6 items-center">
                      {h.sponsors.map((sponsor, i) => (
                        <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <span className="font-headline font-bold text-lg text-muted-foreground">{sponsor}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {h.status === 'past' && h.leaderboard.length > 0 && (
              <Card className="bg-card/50 border-border">
                <CardHeader><CardTitle className="text-sm font-headline font-bold flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Leaderboard</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {h.leaderboard.map((entry) => (
                      <div key={entry.rank} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                            entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                            entry.rank === 2 ? 'bg-gray-300/20 text-gray-300' :
                            entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-muted text-muted-foreground'
                          )}>{entry.rank}</span>
                          <div>
                            <p className="font-bold text-sm">{entry.team}</p>
                            <p className="text-xs text-muted-foreground">{entry.project}</p>
                          </div>
                        </div>
                        <span className="font-bold text-sm text-primary">{entry.score} pts</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{h.organizer[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{h.organizer}</p>
                    <p className="text-[10px] text-muted-foreground">Organizer</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {h.startDate} - {h.endDate}</span>
                  <span className="flex items-center gap-2"><Timer className="w-3 h-3" /> 48 hours</span>
                  <span className="flex items-center gap-2"><Trophy className="w-3 h-3 text-orange-400" /> {h.prizePool}</span>
                  <span className="flex items-center gap-2"><Users className="w-3 h-3" /> {h.participants.toLocaleString()} participants</span>
                </div>
                <Separator />
                {!registered ? (
                  <Button className="w-full gap-2" onClick={() => setRegistered(true)}>
                    <UserPlus className="w-4 h-4" /> Register Team
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Registered
                    </div>
                    <Card className="bg-muted/30 border-border/50">
                      <CardContent className="p-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">My Team</h4>
                        <p className="text-sm font-bold">ByteForce</p>
                        <p className="text-xs text-muted-foreground">3 members</p>
                      </CardContent>
                    </Card>
                    <Button variant="outline" size="sm" className="w-full">Manage Team</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {registered && !h.status.includes('past') && (
              <Card className="bg-card/50 border-border">
                <CardContent className="p-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Register Team</h4>
                  <div className="space-y-3">
                    <Input placeholder="Team name..." />
                    <Textarea placeholder="Team bio (optional)..." className="min-h-[80px]" />
                    <Button className="w-full">Create Team</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
