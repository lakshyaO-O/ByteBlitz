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
  Code2, Heart, GitFork, Eye, Search, Plus, Loader2,
  Globe, Lock, Tag, User, FileCode,
} from 'lucide-react';
import Link from 'next/link';

const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'HTML', 'CSS', 'SQL'];

export default function CodeSharePage() {
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('All');
  const [tab, setTab] = useState('explore');

  const snippets: any[] = [];
  const loading = false;

  const filtered = useMemo(() => {
    let items = snippets;
    if (tab === 'explore') items = items.filter((s: any) => s.isPublic);
    if (search) items = items.filter((s: any) => s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()));
    if (languageFilter !== 'All') items = items.filter((s: any) => s.language === languageFilter);
    return items;
  }, [snippets, search, languageFilter, tab]);

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold text-foreground">
              Code Share
            </h1>
            <p className="text-sm text-muted-foreground">Share and discover code snippets.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-1.5"><Plus className="w-4 h-4" /> Share Code</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Share a Code Snippet</DialogTitle>
              </DialogHeader>
              <ShareSnippetForm />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="explore" onValueChange={setTab}>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="explore">Explore</TabsTrigger>
              <TabsTrigger value="my-snippets">My Snippets</TabsTrigger>
              <TabsTrigger value="liked">Liked</TabsTrigger>
            </TabsList>
            <div className="relative flex-1 max-w-xs w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input placeholder="Search snippets..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          {['All', ...languages].map((lang) => (
            <Button key={lang} variant={languageFilter === lang ? 'default' : 'outline'} size="sm" onClick={() => setLanguageFilter(lang)} className="text-xs h-7">
              {lang}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((snippet: any) => (
              <Link key={snippet.id} href={`/code-share/${snippet.id}`}>
                <Card className="border-border hover:border-primary/50 transition-colors h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className="text-xs font-mono">{snippet.language}</Badge>
                      {snippet.isPublic ? <Globe className="w-3 h-3 text-muted-foreground shrink-0" /> : <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                    </div>
                    <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{snippet.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{snippet.description}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {snippet.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1.5">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{snippet.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{snippet.username}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {snippet.likes}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {snippet.views}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileCode className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No snippets yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to share code with the community.</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mt-4 gap-1.5"><Plus className="w-4 h-4" /> Share your first snippet</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Share a Code Snippet</DialogTitle>
                </DialogHeader>
                <ShareSnippetForm />
              </DialogContent>
            </Dialog>
          </div>
        )}
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
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <Input placeholder="Snippet title..." />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Language</label>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
            <SelectContent>
              {languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <Textarea placeholder="Brief description..." />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Code</label>
        <Textarea placeholder="Paste your code here..." className="font-mono min-h-[200px] text-sm" value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Tags (comma separated)</label>
        <Input placeholder="e.g. algorithm, react, hooks" />
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Globe className="w-3 h-3" /> Public</Button>
        <Button>Share Snippet</Button>
      </div>
    </div>
  );
}
