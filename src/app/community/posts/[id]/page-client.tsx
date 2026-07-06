'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { ReportButton } from '@/components/admin/ReportButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { getDoc, doc, collection, query, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Heart, MessageSquare, Share2, ArrowLeft, Clock, Loader2, Send, Reply, Flag,
} from 'lucide-react';
import type { CommunityPost, PostComment } from '@/types';

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useUser();
  const { toast } = useToast();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      const snap = await getDoc(doc(db, 'communityPosts', id));
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() } as CommunityPost);
      const q = query(collection(db, 'communityPosts', id, 'comments'), orderBy('createdAt', 'asc'));
      const snap2 = await getDocs(q);
      setComments(snap2.docs.map(d => ({ id: d.id, ...d.data() } as PostComment)));
      setLoading(false);
    };
    load();
  }, [id]);

  const handleLike = async () => {
    if (!user || !post) return;
    const { firestore: db } = initializeFirebase();
    if (!db) return;
    const ref = doc(db, 'communityPosts', post.id);
    const liked = post.likedBy?.includes(user.uid);
    if (liked) {
      await updateDoc(ref, { likes: increment(-1), likedBy: arrayRemove(user.uid) });
      setPost({ ...post, likes: post.likes - 1, likedBy: (post.likedBy || []).filter((u: string) => u !== user.uid) });
    } else {
      await updateDoc(ref, { likes: increment(1), likedBy: arrayUnion(user.uid) });
      setPost({ ...post, likes: post.likes + 1, likedBy: [...(post.likedBy || []), user.uid] });
    }
  };

  const handleComment = async () => {
    if (!user || !post || !replyText.trim()) return;
    setSubmitting(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      const ref = await addDoc(collection(db, 'communityPosts', post.id, 'comments'), {
        postId: post.id,
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        content: replyText,
        likes: 0,
        parentId: replyTo,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'communityPosts', post.id), { comments: increment(1) });
      setComments(prev => [...prev, {
        id: ref.id,
        postId: post.id,
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        content: replyText,
        likes: 0,
        parentId: replyTo || undefined,
        createdAt: new Date().toISOString(),
      }]);
      setReplyText('');
      setReplyTo(null);
      setPost({ ...post, comments: post.comments + 1 });
    } catch { toast({ variant: 'destructive', title: 'Failed to comment' }); }
    setSubmitting(false);
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

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </Shell>
    );
  }

  if (!post) {
    return (
      <Shell>
        <div className="text-center py-20 text-muted-foreground">Post not found.</div>
      </Shell>
    );
  }

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  return (
    <Shell>
      <div className="space-y-6 max-w-3xl">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <Card className="border-border">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-9 w-9 border border-muted shrink-0">
                <AvatarImage src={post.photoURL} />
                <AvatarFallback className="bg-muted text-xs">{(post.username || '?')[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{post.username}</span>
                  <Badge variant="outline" className="text-xs">{post.type.replace('_', ' ')}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" /> {getTimeAgo(post.createdAt)}
                  </span>
                </div>
                <h1 className="text-lg font-semibold mt-2">{post.title}</h1>
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{post.content}</p>
                {post.code && (
                  <pre className="mt-3 p-3 rounded bg-muted/30 border border-border text-sm font-mono overflow-x-auto">
                    <code>{post.code}</code>
                  </pre>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {post.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-primary" onClick={handleLike}>
                <Heart className={cn('w-3.5 h-3.5', post.likedBy?.includes(user?.uid || '') && 'fill-primary text-primary')} />
                {post.likes}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-primary">
                <MessageSquare className="w-3.5 h-3.5" />
                {post.comments}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-primary" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/community/posts/${post.id}`); toast({ title: 'Link copied!' }); }}>
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <ReportButton targetType="post" targetId={post.id} targetLabel={post.title} />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Comments ({comments.length})
          </h2>

          <div className="space-y-4">
            {rootComments.map(comment => (
              <CommentThread
                key={comment.id}
                comment={comment}
                replies={getReplies(comment.id)}
                onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                isReplying={replyTo === comment.id}
                replyText={replyText}
                setReplyText={setReplyText}
                onSubmitReply={handleComment}
                submitting={submitting}
                getTimeAgo={getTimeAgo}
                userId={user?.uid || ''}
              />
            ))}
            {rootComments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first to reply!</p>
            )}
          </div>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 border border-muted shrink-0">
                  <AvatarFallback className="bg-muted text-xs">{(user?.displayName || 'Y')[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex justify-between items-center">
                    {replyTo && (
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setReplyTo(null)}>
                        Cancel reply
                      </Button>
                    )}
                    <Button size="sm" className="gap-1.5 ml-auto" onClick={handleComment} disabled={submitting || !replyText.trim()}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {replyTo ? 'Reply' : 'Comment'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function CommentThread({ comment, replies, onReply, isReplying, replyText, setReplyText, onSubmitReply, submitting, getTimeAgo, userId }: {
  comment: PostComment; replies: PostComment[]; onReply: () => void; isReplying: boolean;
  replyText: string; setReplyText: (v: string) => void; onSubmitReply: () => void; submitting: boolean;
  getTimeAgo: (d: string) => string; userId: string;
}) {
  return (
    <div className="space-y-3">
      <Card className="bg-card/30 border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 border border-muted shrink-0">
              <AvatarImage src={comment.photoURL} />
              <AvatarFallback className="bg-muted text-xs">{(comment.username || '?')[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.username}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {getTimeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground mt-1" onClick={onReply}>
                <Reply className="w-3 h-3" /> Reply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {replies.length > 0 && (
        <div className="ml-8 space-y-3">
          {replies.map(reply => (
            <Card key={reply.id} className="bg-card/20 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 border border-muted shrink-0">
                    <AvatarFallback className="bg-muted text-[10px]">{(reply.username || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">{reply.username}</span>
                      <span className="text-xs text-muted-foreground">{getTimeAgo(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-0.5">{reply.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isReplying && (
        <div className="ml-8 flex gap-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            rows={2}
            className="text-sm flex-1"
          />
          <Button size="sm" className="gap-1 self-end" onClick={onSubmitReply} disabled={submitting || !replyText.trim()}>
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </Button>
        </div>
      )}
    </div>
  );
}
