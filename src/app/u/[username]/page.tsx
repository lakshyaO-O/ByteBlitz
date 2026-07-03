'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User, Zap, Trophy, Flame, Star, Code2, Github, Linkedin,
  Twitter, Globe, MapPin, Calendar, Medal, Target, Swords,
  BookOpen, Eye, Heart, GitFork, CheckCircle2, Loader2,
  MessageCircle, UserPlus, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mockUser = {
  username: 'alice_dev', displayName: 'Alice Johnson', title: 'Full Stack Developer',
  bio: 'Building the future of web development. Open source enthusiast. Hackathon winner.',
  avatar: '', tier: 'Expert', level: 42, rating: 2150,
  wins: 128, losses: 72, streak: 15, xp: 21000, problemsSolved: 340,
  github: 'alice_dev', linkedin: 'alicejohnson', twitter: '@alice_dev', website: 'https://alice.dev',
  skills: ['React', 'TypeScript', 'Node.js', 'Python', 'Docker', 'GraphQL', 'Go', 'PostgreSQL'],
  achievements: [
    { name: '100 Day Streak', icon: Flame, achieved: true },
    { name: 'Hackathon Winner', icon: Trophy, achieved: true },
    { name: 'Code Master', icon: Star, achieved: true },
    { name: '500 Problems', icon: Code2, achieved: false },
  ],
  featuredProjects: [
    { id: '1', title: 'DevFlow', description: 'Real-time collaborative code editor', likes: 156, techs: ['React', 'Node.js'] },
    { id: '2', title: 'CloudBoard', description: 'Online whiteboard for remote teams', likes: 89, techs: ['Next.js', 'TypeScript'] },
    { id: '3', title: 'LogSentry', description: 'Log monitoring dashboard', likes: 134, techs: ['Next.js', 'PostgreSQL'] },
  ],
  codeShares: [
    { id: '1', title: 'Binary Search Implementation', language: 'Python', likes: 42 },
    { id: '2', title: 'Custom useDebounce Hook', language: 'TypeScript', likes: 89 },
  ],
  activityFeed: [
    { type: 'solve', message: 'Solved "Two Sum" problem', time: '2h ago', icon: CheckCircle2, color: 'text-emerald-400' },
    { type: 'like', message: 'Liked "CloudBoard" project', time: '4h ago', icon: Heart, color: 'text-red-400' },
    { type: 'project', message: 'Updated "DevFlow" project', time: '1d ago', icon: Code2, color: 'text-primary' },
    { type: 'achievement', message: 'Earned "Hackathon Winner" badge', time: '2d ago', icon: Trophy, color: 'text-yellow-400' },
    { type: 'streak', message: 'Reached 15-day streak', time: '3d ago', icon: Flame, color: 'text-orange-400' },
  ],
  githubRepos: [
    { name: 'devflow', stars: 234, forks: 56, description: 'Real-time collaborative code editor', language: 'TypeScript' },
    { name: 'cloudboard', stars: 89, forks: 23, description: 'Online whiteboard', language: 'TypeScript' },
    { name: 'algorithms', stars: 45, forks: 12, description: 'Algorithm implementations', language: 'Python' },
  ],
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const user = mockUser;
  const [following, setFollowing] = useState(false);

  const winRate = user.wins + user.losses > 0 ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0;

  const tierColorMap: Record<string, string> = {
    Beginner: 'text-gray-400 border-gray-400/30',
    Learner: 'text-emerald-400 border-emerald-400/30',
    Intermediate: 'text-blue-400 border-blue-400/30',
    Advanced: 'text-purple-400 border-purple-400/30',
    Expert: 'text-orange-400 border-orange-400/30',
    Master: 'text-red-400 border-red-400/30',
  };

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/5 to-secondary/5 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-primary/30">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white">
                  LVL {user.level}
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-headline font-bold">{user.displayName}</h1>
                  <Badge variant="outline" className={cn('text-[10px] uppercase tracking-widest', tierColorMap[user.tier] || 'text-muted-foreground')}>
                    <Medal className="w-3 h-3 mr-1" /> {user.tier}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    @{user.username}
                  </Badge>
                </div>
                <p className="text-sm text-foreground">{user.title}</p>
                <p className="text-sm text-muted-foreground max-w-xl">{user.bio}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> San Francisco, CA</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined Jun 2025</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> {user.xp.toLocaleString()} XP</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {user.streak} day streak</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button onClick={() => setFollowing(!following)} className={cn('gap-2', following ? 'variant-outline' : '')}>
                    <UserPlus className="w-4 h-4" /> {following ? 'Following' : 'Follow'}
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => router.push('/chats')}><MessageCircle className="w-3 h-3" /> Message</Button>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {user.github && (
                    <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {user.linkedin && (
                    <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {user.twitter && (
                    <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {user.website && (
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatBox label="Rating" value={user.rating} color="text-primary" />
          <StatBox label="Wins" value={user.wins} color="text-emerald-400" />
          <StatBox label="Losses" value={user.losses} color="text-destructive" />
          <StatBox label="Win Rate" value={`${winRate}%`} color="text-secondary" />
          <StatBox label="Streak" value={user.streak} color="text-orange-400" />
          <StatBox label="XP" value={user.xp.toLocaleString()} color="text-yellow-400" />
          <StatBox label="Solved" value={user.problemsSolved} color="text-cyan-400" />
        </div>

        <Tabs defaultValue="projects">
          <TabsList className="grid grid-cols-5 gap-2 h-auto bg-muted/50 p-1">
            <TabsTrigger value="projects" className="text-xs gap-1"><Code2 className="w-3 h-3" /> Projects</TabsTrigger>
            <TabsTrigger value="skills" className="text-xs gap-1"><Zap className="w-3 h-3" /> Skills</TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs gap-1"><Trophy className="w-3 h-3" /> Achievements</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs gap-1"><Activity className="w-3 h-3" /> Activity</TabsTrigger>
            <TabsTrigger value="code" className="text-xs gap-1"><Code2 className="w-3 h-3" /> Code Shares</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.featuredProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <Card className="bg-card/50 border-border hover:border-primary/30 transition-all h-full">
                    <CardContent className="p-4">
                      <h4 className="font-bold text-sm">{p.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.techs.map(t => <Badge key={t} variant="secondary" className="text-[8px] uppercase tracking-widest">{t}</Badge>)}
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Heart className="w-3 h-3" /> {p.likes}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="skills" className="mt-6">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs font-mono bg-muted/30 px-3 py-1.5">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {user.achievements.map((a) => {
                const Icon = a.icon;
                return (
                  <Card key={a.name} className={cn('bg-card/50 border-border', a.achieved ? 'border-primary/30' : 'opacity-50')}>
                    <CardContent className="p-5 text-center space-y-2">
                      <Icon className={cn('w-8 h-8 mx-auto', a.achieved ? 'text-primary' : 'text-muted-foreground')} />
                      <p className="text-xs font-bold uppercase tracking-widest">{a.name}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {user.activityFeed.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <Icon className={cn('w-4 h-4 shrink-0', item.color)} />
                        <span className="flex-1">{item.message}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.codeShares.map((s) => (
                <Link key={s.id} href={`/code-share/${s.id}`}>

                  <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{s.title}</p>
                        <Badge variant="outline" className="text-[8px] uppercase tracking-widest mt-1 font-mono">{s.language}</Badge>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="w-3 h-3" /> {s.likes}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-sm font-headline font-bold uppercase tracking-widest flex items-center gap-2">
              <Github className="w-4 h-4" /> GitHub Repositories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.githubRepos.map((repo) => (
                <Card key={repo.name} className="bg-muted/30 border-border/50">
                  <CardContent className="p-4">
                    <p className="font-bold text-sm truncate">{repo.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{repo.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[8px] uppercase tracking-widest">{repo.language}</Badge>
                      <span className="flex items-center gap-1">⭐ {repo.stars}</span>
                      <span className="flex items-center gap-1">🐙 {repo.forks}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-4 text-center space-y-1">
        <div className={cn('text-xl md:text-2xl font-headline font-bold', color)}>{value}</div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
