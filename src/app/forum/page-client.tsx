'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { createThread, getThreads, searchThreads } from '@/services/forum';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  MessageSquare, Eye, Clock, Pin, CheckCircle2, Plus, Search, Loader2,
  ArrowUp, MessageCircle, Hash,
} from 'lucide-react';
import type { DiscussionForum } from '@/types';

const CATEGORIES = [
  { value: 'all', label: 'All', icon: Hash },
  { value: 'general', label: 'General', icon: MessageCircle },
  { value: 'dsa', label: 'DSA', icon: Hash },
  { value: 'competitive', label: 'Competitive', icon: Hash },
  { value: 'web-dev', label: 'Web Dev', icon: Hash },
  { value: 'ai-ml', label: 'AI/ML', icon: Hash },
  { value: 'career', label: 'Career', icon: Hash },
  { value: 'showcase', label: 'Showcase', icon: Hash },
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'top', label: 'Top' },
  { value: 'unanswered', label: 'Unanswered' },
];

export default function ForumPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [threads, setThreads] = useState<DiscussionForum[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formTags, setFormTags] = useState('');

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      if (searchQuery) {
        const results = await searchThreads(searchQuery);
        setThreads(results);
      } else {
        const result = await getThreads(activeCategory === 'all' ? undefined : activeCategory);
        let list = result.threads;
        if (sortBy === 'top') list.sort((a, b) => b.views - a.views);
        else if (sortBy === 'unanswered') list = list.filter(t => t.replies === 0);
        setThreads(list);
      }
    } catch { /* fallback empty */ }
    setLoading(false);
  }, [activeCategory, sortBy, searchQuery]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const handleCreateThread = async () => {
    if (!user || !formTitle.trim() || !formContent.trim()) return;
    setSubmitting(true);
    try {
      const id = await createThread({
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        title: formTitle,
        content: formContent,
        category: formCategory,
        tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
        isPinned: false,
        isSolved: false,
      });
      if (id) {
        toast({ title: 'Thread created!' });
        setCreateOpen(false);
        setFormTitle(''); setFormContent(''); setFormTags('');
        loadThreads();
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to create thread' }); }
    setSubmitting(false);
  };

  const getTimeAgo = (date: string) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const pinnedThreads = threads.filter(t => t.isPinned);
  const regularThreads = threads.filter(t => !t.isPinned);

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter">Forum</h1>
            <p className="text-muted-foreground">Discuss coding, algorithms, and career with the community.</p>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New Thread
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-48 shrink-0">
            <Tabs value={activeCategory} onValueChange={v => { setActiveCategory(v); setSearchQuery(''); }} orientation="vertical" className="w-full">
              <TabsList className="flex lg:flex-col bg-muted/50 w-full h-auto gap-0 p-1">
                {CATEGORIES.map(cat => (
                  <TabsTrigger key={cat.value} value={cat.value} className="justify-start gap-2 text-xs w-full">
                    <cat.icon className="w-3.5 h-3.5" /> {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <Tabs value={sortBy} onValueChange={setSortBy}>
                <TabsList className="bg-muted/50">
                  {SORT_OPTIONS.map(s => (
                    <TabsTrigger key={s.value} value={s.value} className="text-xs">{s.label}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="relative flex-1 max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search threads..." className="pl-10 bg-muted/50 border-border" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="bg-card/50 border-border">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex gap-4">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : threads.length > 0 ? (
              <div className="space-y-3">
                {pinnedThreads.map(t => (
                  <ThreadCard key={t.id} thread={t} getTimeAgo={getTimeAgo} pinned />
                ))}
                {regularThreads.map(t => (
                  <ThreadCard key={t.id} thread={t} getTimeAgo={getTimeAgo} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-60" />
                <p>No threads found. Start a discussion!</p>
              </div>
            )}
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Create Thread</DialogTitle>
              <DialogDescription>Start a new discussion with the community.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Thread title..." />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={formContent} onChange={e => setFormContent(e.target.value)} placeholder="Write your question or discussion..." rows={5} />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="e.g. python, recursion, help" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateThread} disabled={submitting || !formTitle.trim() || !formContent.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Thread
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}

function ThreadCard({ thread, getTimeAgo, pinned }: { thread: DiscussionForum; getTimeAgo: (d: string) => string; pinned?: boolean }) {
  return (
    <Card
      className={cn(
        'bg-card/50 border-border hover:border-primary/30 transition-all cursor-pointer',
        pinned && 'border-yellow-500/30 bg-yellow-500/5'
      )}
      onClick={() => window.location.href = `/forum/${thread.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 border border-muted shrink-0">
            <AvatarImage src={thread.photoURL} />
            <AvatarFallback className="bg-muted text-[10px]">{(thread.username || '?')[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {pinned && <Pin className="w-3.5 h-3.5 text-yellow-400" />}
              {thread.isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              <h3 className="font-bold text-sm leading-snug">{thread.title}</h3>
              <Badge variant="outline" className="text-[8px] uppercase tracking-widest">{thread.category}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {thread.username} &middot; {getTimeAgo(thread.createdAt)}
            </p>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {thread.replies} replies</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {thread.views} views</span>
              {thread.lastActivity && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {getTimeAgo(thread.lastActivity)}</span>
              )}
            </div>
            {thread.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {thread.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[8px] uppercase tracking-widest">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="hidden sm:flex flex-col items-center gap-1 text-center shrink-0">
            <ArrowUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-bold">{thread.views}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
