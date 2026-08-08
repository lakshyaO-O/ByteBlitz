'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Github, Link2, Unlink, RefreshCw, CheckCircle2, Loader2,
  AlertCircle, ChevronRight, Star, GitFork, Clock, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mockConnected = true;
const mockUser = {
  githubUsername: 'alice_dev',
  avatar: '',
  publicRepos: 24,
  joinedDate: '2024-03-15',
};

const mockRepos = [
  { name: 'devflow', stars: 234, forks: 56, language: 'TypeScript', description: 'Real-time collaborative code editor', updatedAt: '2 days ago', synced: true },
  { name: 'cloudboard', stars: 89, forks: 23, language: 'TypeScript', description: 'Online whiteboard for remote teams', updatedAt: '1 week ago', synced: true },
  { name: 'algorithms', stars: 45, forks: 12, language: 'Python', description: 'Algorithm implementations and practice', updatedAt: '2 weeks ago', synced: false },
  { name: 'portfolio', stars: 67, forks: 34, language: 'HTML', description: 'Personal portfolio website', updatedAt: '3 weeks ago', synced: true },
  { name: 'api-forge', stars: 210, forks: 67, language: 'Go', description: 'CLI tool for REST API boilerplate', updatedAt: '1 month ago', synced: false },
];

export default function GithubSettingsPage() {
  const [connected, setConnected] = useState(mockConnected);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncedRepos, setSyncedRepos] = useState<Set<string>>(new Set(mockRepos.filter(r => r.synced).map(r => r.name)));

  const handleSync = (repoName: string) => {
    setSyncing(true);
    setTimeout(() => {
      setSyncedRepos(prev => new Set(prev).add(repoName));
      setSyncing(false);
    }, 1000);
  };

  const handleSyncAll = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncedRepos(new Set(mockRepos.map(r => r.name)));
      setSyncing(false);
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setSyncedRepos(new Set());
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold text-foreground">
            GitHub
          </h1>
          <p className="text-muted-foreground">Connect your GitHub account to showcase your repositories.</p>
        </div>

        {!connected ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto">
                <Github className="w-8 h-8 text-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-headline font-bold">Connect GitHub</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Link your GitHub account to automatically display your repositories on your profile. We&apos;ll only access public information.
                </p>
              </div>
              <Button size="lg" className="gap-2">
                <Github className="w-5 h-5" /> Connect with GitHub
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 border-2 border-emerald-500/30">
                      <AvatarImage src={mockUser.avatar} />
                      <AvatarFallback className="bg-emerald-500/10 text-emerald-400 text-lg font-bold">
                        {mockUser.githubUsername[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-headline font-bold">{mockUser.githubUsername}</h2>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] uppercase tracking-widest">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Connected
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {mockUser.publicRepos} public repositories · Joined {mockUser.joinedDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleSyncAll} disabled={syncing}>
                      <RefreshCw className={cn('w-3 h-3', syncing && 'animate-spin')} /> Sync All
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-2" onClick={handleDisconnect}>
                      <Unlink className="w-3 h-3" /> Disconnect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm">Auto-sync</p>
                    <p className="text-xs text-muted-foreground">Automatically sync repositories when you visit this page.</p>
                  </div>
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                    <Github className="w-4 h-4" /> Repositories
                  </CardTitle>
                  <Badge variant="outline" className="text-[11px] uppercase tracking-wider">
                    {syncedRepos.size}/{mockRepos.length} synced
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockRepos.map((repo) => {
                    const isSynced = syncedRepos.has(repo.name);
                    return (
                      <Card key={repo.name} className={cn(
                        'bg-muted/20 border-border/50 transition-all',
                        isSynced && 'border-emerald-500/20',
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm truncate">{repo.name}</p>
                                {isSynced && (
                                  <Badge variant="outline" className="text-[8px] uppercase tracking-widest text-emerald-400 border-emerald-400/30">
                                    <CheckCircle2 className="w-2 h-2 mr-0.5" /> Synced
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{repo.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                <Badge variant="secondary" className="text-[8px] uppercase tracking-widest">{repo.language}</Badge>
                                <span className="flex items-center gap-1"><Star className="w-2.5 h-2.5" /> {repo.stars}</span>
                                <span className="flex items-center gap-1"><GitFork className="w-2.5 h-2.5" /> {repo.forks}</span>
                                <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {repo.updatedAt}</span>
                              </div>
                            </div>
                            <Button
                              variant={isSynced ? 'ghost' : 'outline'}
                              size="sm"
                              className="shrink-0 text-xs gap-1"
                              onClick={() => handleSync(repo.name)}
                              disabled={isSynced || syncing}
                            >
                              {isSynced ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ) : syncing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              {isSynced ? 'Synced' : 'Sync'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Shell>
  );
}
