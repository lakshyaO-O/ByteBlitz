'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getThread, replyToThread, searchThreads } from '@/services/forum';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, MessageSquare, Eye, Clock, Pin, CheckCircle2, Heart,
  Send, Loader2, Code2, ThumbsUp,
} from 'lucide-react';
import type { DiscussionForum, ForumReply } from '@/types';

export default function ForumThreadPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useUser();
  const { toast } = useToast();
  const [thread, setThread] = useState<DiscussionForum | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyCode, setReplyCode] = useState('');
  const [includeCode, setIncludeCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const threadData = await getThread(id);
        setThread(threadData);
        const { firestore: db } = initializeFirebase();
        if (db) {
          const q = query(collection(db, 'forumThreads', id, 'replies'), orderBy('createdAt', 'asc'));
          const snap = await getDocs(q);
          setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() } as ForumReply)));
        }
      } catch { /* fallback */ }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleReply = async () => {
    if (!user || !thread || !replyContent.trim()) return;
    setSubmitting(true);
    try {
      const replyId = await replyToThread(thread.id, {
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        content: replyContent,
        code: includeCode ? replyCode : undefined,
        codeLanguage: undefined,
      });
      if (replyId) {
        toast({ title: 'Reply posted!' });
        setReplyContent('');
        setReplyCode('');
        setIncludeCode(false);
        setThread({ ...thread, replies: thread.replies + 1 });
        const { firestore: db } = initializeFirebase();
        if (db) {
          const q = query(collection(db, 'forumThreads', thread.id, 'replies'), orderBy('createdAt', 'asc'));
          const snap = await getDocs(q);
          setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() } as ForumReply)));
        }
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to post reply' }); }
    setSubmitting(false);
  };

  const handleLikeReply = async (reply: ForumReply) => {
    if (!user) return;
    setReplies(prev => prev.map(r => r.id === reply.id ? { ...r, likes: r.likes + 1 } : r));
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

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      </Shell>
    );
  }

  if (!thread) {
    return (
      <Shell>
        <div className="text-center py-20 text-muted-foreground">Thread not found.</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6 max-w-4xl">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Forum
        </Button>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {thread.isPinned && (
                <Badge className="text-[9px] uppercase tracking-widest bg-yellow-500/10 text-yellow-400 border-yellow-500/30 gap-1">
                  <Pin className="w-3 h-3" /> Pinned
                </Badge>
              )}
              {thread.isSolved && (
                <Badge className="text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Solved
                </Badge>
              )}
              <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{thread.category}</Badge>
            </div>

            <h1 className="text-2xl font-headline font-bold">{thread.title}</h1>

            <div className="flex items-center gap-3 mt-3">
              <Avatar className="h-8 w-8 border border-muted">
                <AvatarImage src={thread.photoURL} />
                <AvatarFallback className="bg-muted text-[10px]">{(thread.username || '?')[0]}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <span className="font-bold">{thread.username}</span>
                <span className="text-muted-foreground ml-2">{getTimeAgo(thread.createdAt)}</span>
              </div>
            </div>

            <p className="text-sm mt-4 whitespace-pre-wrap leading-relaxed">{thread.content}</p>

            {thread.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {thread.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[9px] uppercase tracking-widest">{tag}</Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {thread.replies} replies</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {thread.views} views</span>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-headline font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Replies ({replies.length})
          </h2>

          {replies.length > 0 ? (
            <div className="space-y-4">
              {replies.map(reply => (
                <Card key={reply.id} className={cn('bg-card/50 border-border', reply.isSolution && 'border-emerald-500/30 bg-emerald-500/5')}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 border border-muted shrink-0">
                        <AvatarImage src={reply.photoURL} />
                        <AvatarFallback className="bg-muted text-[10px]">{(reply.username || '?')[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{reply.username}</span>
                          <span className="text-xs text-muted-foreground">{getTimeAgo(reply.createdAt)}</span>
                          {reply.isSolution && (
                            <Badge className="text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Solution
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-2 whitespace-pre-wrap">{reply.content}</p>
                        {reply.code && (
                          <pre className="mt-3 p-3 rounded-lg bg-muted/30 border border-border text-xs font-code overflow-x-auto">
                            <code>{reply.code}</code>
                          </pre>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={() => handleLikeReply(reply)}>
                            <ThumbsUp className="w-3 h-3" /> {reply.likes}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No replies yet. Be the first to answer!</p>
          )}
        </div>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-5">
            <h3 className="font-bold text-sm mb-3">Post a Reply</h3>
            <div className="space-y-3">
              <Textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                rows={4}
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                <Switch id="include-code" checked={includeCode} onCheckedChange={setIncludeCode} />
                <Label htmlFor="include-code" className="text-xs flex items-center gap-1 cursor-pointer">
                  <Code2 className="w-3.5 h-3.5" /> Include code block
                </Label>
              </div>
              {includeCode && (
                <Textarea
                  placeholder="Paste your code..."
                  value={replyCode}
                  onChange={e => setReplyCode(e.target.value)}
                  rows={5}
                  className="font-code text-sm"
                />
              )}
              <div className="flex justify-end">
                <Button size="sm" className="gap-2" onClick={handleReply} disabled={submitting || !replyContent.trim()}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
