'use client';

import React, { useState, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Code2, Heart, GitFork, Eye, Search, Plus, Filter, Loader2,
  Globe, Lock, Tag, User, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'HTML', 'CSS', 'SQL'];

const mockSnippets = [
  { id: '1', title: 'Binary Search Implementation', description: 'A clean binary search function with O(log n) time complexity.', language: 'Python', username: 'alice_dev', likes: 42, forks: 12, views: 256, tags: ['algorithm', 'search'], isPublic: true },
  { id: '2', title: 'React Custom Hook: useDebounce', description: 'Debounce hook for search inputs and API calls.', language: 'TypeScript', username: 'bob_codes', likes: 89, forks: 34, views: 1024, tags: ['react', 'hooks'], isPublic: true },
  { id: '3', title: 'Docker Compose for Node.js + Postgres', description: 'Container setup for a full-stack Node.js app with PostgreSQL.', language: 'YAML', username: 'charlie', likes: 27, forks: 8, views: 189, tags: ['docker', 'devops'], isPublic: true },
  { id: '4', title: 'Quick Sort in Go', description: 'Concurrent quicksort implementation using Go routines.', language: 'Go', username: 'diana', likes: 63, forks: 21, views: 512, tags: ['algorithm', 'concurrency'], isPublic: true },
  { id: '5', title: 'CSS Grid Layout Generator', description: 'Responsive grid template using CSS Grid with fallbacks.', language: 'CSS', username: 'eve_style', likes: 35, forks: 15, views: 420, tags: ['css', 'layout'], isPublic: false },
  { id: '6', title: 'JWT Auth Middleware (Express)', description: 'Production-ready JWT verification middleware for Express.js.', language: 'JavaScript', username: 'frank_js', likes: 104, forks: 47, views: 890, tags: ['auth', 'express'], isPublic: true },
];

export default function CodeSharePage() {
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');
  const [tab, setTab] = useState('explore');

  const filtered = useMemo(() => {
    let items = [...mockSnippets];
    if (tab === 'explore') items = items.filter(s => s.isPublic);
    if (search) items = items.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()));
    if (languageFilter !== 'All') items = items.filter(s => s.language === languageFilter);
    if (sortBy === 'popular') items.sort((a, b) => b.likes - a.likes);
    else items.sort((a, b) => b.views - a.views);
    return items;
  }, [search, languageFilter, sortBy, tab]);

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              CODE <span className="text-primary neon-text">SHARE</span>
            </h1>
            <p className="text-muted-foreground">Share and discover code snippets with the community.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Share Code</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-headline font-bold">Share a Code Snippet</DialogTitle>
              </DialogHeader>
              <ShareSnippetForm />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="explore" onValueChange={setTab}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="explore">Explore</TabsTrigger>
              <TabsTrigger value="my-snippets">My Snippets</TabsTrigger>
              <TabsTrigger value="liked">Liked</TabsTrigger>
            </TabsList>
            <div className="relative flex-1 max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search snippets..." className="pl-10 bg-muted/50 border-border" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {['All', ...languages].map((lang) => (
            <Button key={lang} variant={languageFilter === lang ? 'default' : 'outline'} size="sm" onClick={() => setLanguageFilter(lang)} className="text-xs font-bold uppercase tracking-widest">
              {lang}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button variant={sortBy === 'popular' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSortBy('popular')} className="text-xs">Popular</Button>
            <Button variant={sortBy === 'recent' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSortBy('recent')} className="text-xs">Recent</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((snippet, i) => (
            <motion.div key={snippet.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-card/50 border-border hover:border-primary/30 transition-all group cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-muted/50 font-mono">
                      {snippet.language}
                    </Badge>
                    {!snippet.isPublic && <Lock className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <h3 className="font-headline font-bold text-lg group-hover:text-primary transition-colors">{snippet.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">{snippet.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {snippet.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[8px] uppercase tracking-widest">
                        <Tag className="w-2 h-2 mr-1" />{tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{snippet.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{snippet.username}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {snippet.likes}</span>
                      <span className="flex items-center gap-1"><GitFork className="w-3 h-3" /> {snippet.forks}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {snippet.views}</span>
                    </div>
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

function ShareSnippetForm() {
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Title</label>
          <Input placeholder="Snippet title..." />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Language</label>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
            <SelectContent>
              {languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
        <Textarea placeholder="Brief description..." />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Code</label>
        <Textarea placeholder="Paste your code here..." className="font-mono min-h-[200px]" value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tags (comma separated)</label>
        <Input placeholder="e.g. algorithm, react, hooks" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs"><Globe className="w-3 h-3" /> Public</Button>
          <Button variant="ghost" size="sm" className="gap-2 text-xs"><Lock className="w-3 h-3" /> Private</Button>
        </div>
        <Button>Share Snippet</Button>
      </div>
    </div>
  );
}
