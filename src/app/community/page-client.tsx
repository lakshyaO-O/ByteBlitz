'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { createPost, getPosts, likePost } from '@/services/community';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  FileText, MessageSquare, Share2, Heart, Search, Plus, Loader2, Clock,
  Users, Tag,
} from 'lucide-react';
import type { CommunityPost, PostType } from '@/types';

const POST_TYPES: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'code_share', label: 'Code' },
  { value: 'project_showcase', label: 'Projects' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'tip', label: 'Tips' },
];

export default function CommunityPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLanguage, setFormLanguage] = useState('javascript');
  const [formTags, setFormTags] = useState('');
  const [formType, setFormType] = useState<PostType>('discussion');
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const filter = typeFilter !== 'all' ? { type: typeFilter as PostType } : undefined;
      const result = await getPosts(filter);
      setPosts(result.posts);
    } catch { /* fallback empty */ }
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleCreatePost = async () => {
    if (!user || !formTitle.trim() || !formContent.trim()) return;
    setSubmitting(true);
    try {
      const id = await createPost({
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        type: formType,
        title: formTitle,
        content: formContent,
        code: formCode || undefined,
        codeLanguage: formCode ? formLanguage as any : undefined,
        tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      });
      if (id) {
        toast({ title: 'Post created!' });
        setCreateOpen(false);
        setFormTitle('');
        setFormContent('');
        setFormCode('');
        setFormTags('');
        loadPosts();
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to create post' }); }
    setSubmitting(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    await likePost(postId, user.uid);
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked = p.likedBy?.includes(user.uid);
      return {
        ...p,
        likes: p.likes + (liked ? -1 : 1),
        likedBy: liked
          ? (p.likedBy || []).filter((id: string) => id !== user.uid)
          : [...(p.likedBy || []), user.uid],
      };
    }));
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold text-foreground">Community</h1>
            <p className="text-sm text-muted-foreground">Share code, projects, and learn together.</p>
          </div>
          <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Create Post
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-full sm:w-auto">
            <TabsList>
              {POST_TYPES.map(t => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative flex-1 max-w-xs w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input placeholder="Search posts..." className="pl-8 h-9 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-3">
            {filteredPosts.map(post => (
              <Card key={post.id} className="border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 border border-muted shrink-0">
                      <AvatarImage src={post.photoURL} />
                      <AvatarFallback className="bg-muted text-xs">{(post.username || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{post.username}</span>
                        <Badge variant="outline" className="text-xs">{post.type.replace('_', ' ')}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" /> {getTimeAgo(post.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-medium mt-1 cursor-pointer hover:text-primary transition-colors" onClick={() => router.push(`/community/posts/${post.id}`)}>{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{post.content}</p>
                      {post.code && (
                        <pre className="mt-2 p-3 rounded bg-muted/30 border border-border text-sm font-mono overflow-x-auto">
                          <code>{post.code}</code>
                        </pre>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {post.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pt-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-primary" onClick={() => handleLike(post.id)}>
                      <Heart className={cn('w-3.5 h-3.5', post.likedBy?.includes(user?.uid || '') && 'fill-primary text-primary')} />
                      {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-primary" onClick={() => router.push(`/community/posts/${post.id}`)}>
                      <MessageSquare className="w-3.5 h-3.5" />
                      {post.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-primary" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/community/posts/${post.id}`); toast({ title: 'Link copied!' }); }}>
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No posts yet. Be the first to share!</p>
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base"><FileText className="w-4 h-4 text-primary" /> Create Post</DialogTitle>
              <DialogDescription>Share your code, project, or thoughts with the community.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Post Type</Label>
                <Select value={formType} onValueChange={v => setFormType(v as PostType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discussion">Discussion</SelectItem>
                    <SelectItem value="code_share">Code Share</SelectItem>
                    <SelectItem value="project_showcase">Project Showcase</SelectItem>
                    <SelectItem value="tip">Tip</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Title</Label>
                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Post title..." />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Content</Label>
                <Textarea value={formContent} onChange={e => setFormContent(e.target.value)} placeholder="Write something..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Code (optional)</Label>
                <Textarea value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="Paste your code..." rows={6} className="font-mono text-sm" />
              </div>
              {formCode && (
                <div className="space-y-2">
                  <Label className="text-sm">Language</Label>
                  <Select value={formLanguage} onValueChange={setFormLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'].map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm">Tags (comma separated)</Label>
                <Input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="e.g. react, dsa, tutorial" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePost} disabled={submitting || !formTitle.trim() || !formContent.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
