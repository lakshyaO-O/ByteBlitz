'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shell } from '@/components/layout/Shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { TimeAgo } from '@/components/community/TimeAgo';
import { CommentForm } from '@/components/community/CommentForm';
import { CommentThread } from '@/components/community/CommentThread';
import { PostSkeletonCard, CommentSkeleton } from '@/components/community/SkeletonCard';
import { ReportButton } from '@/components/admin/ReportButton';
import { getPostById, getComments, addComment, likePost } from '@/services/community';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Heart, MessageSquare, Share2, Clock, Code,
} from 'lucide-react';
import type { CommunityPost, PostComment } from '@/types';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useUser();
  const { toast } = useToast();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [postData, commentsData] = await Promise.all([
          getPostById(id),
          getComments(id),
        ]);
        if (postData) setPost(postData);
        setComments(commentsData);
      } catch {
        toast({ variant: 'destructive', title: 'Failed to load post' });
      }
      setLoading(false);
    };
    load();
  }, [id, toast]);

  const handleLike = async () => {
    if (!user || !post || liking) return;
    setLiking(true);
    try {
      const result = await likePost(post.id, user.uid);
      setPost({
        ...post,
        likes: post.likes + (result.liked ? 1 : -1),
        likedBy: result.liked
          ? [...(post.likedBy || []), user.uid]
          : (post.likedBy || []).filter((u: string) => u !== user.uid),
      });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to like' });
    }
    setLiking(false);
  };

  const handleComment = useCallback(async (text: string) => {
    if (!user || !post) return;
    const commentId = await addComment(post.id, {
      userId: user.uid,
      username: user.displayName || 'Anonymous',
      photoURL: user.photoURL || '',
      content: text,
      parentId: undefined,
    });
    if (commentId) {
      setComments(prev => [...prev, {
        id: commentId,
        postId: post.id,
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        content: text,
        likes: 0,
        createdAt: new Date().toISOString(),
      }]);
      setPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : prev);
    }
  }, [user, post]);

  const handleReply = useCallback(async (parentId: string, text: string) => {
    if (!user || !post) return;
    const commentId = await addComment(post.id, {
      userId: user.uid,
      username: user.displayName || 'Anonymous',
      photoURL: user.photoURL || '',
      content: text,
      parentId,
    });
    if (commentId) {
      setComments(prev => [...prev, {
        id: commentId,
        postId: post.id,
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        content: text,
        likes: 0,
        parentId,
        createdAt: new Date().toISOString(),
      }]);
      setPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : prev);
    }
  }, [user, post]);

  const rootComments = comments.filter(c => !c.parentId);

  if (loading) {
    return (
      <Shell>
        <div className="space-y-4 max-w-3xl pb-8">
          <PostSkeletonCard />
          <Separator />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CommentSkeleton key={i} />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (!post) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-muted-foreground/60" />
          </div>
          <p className="font-medium mb-1">Post not found</p>
          <p className="text-sm text-muted-foreground/70">This post may have been deleted or never existed.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/community')}>
            Back to community
          </Button>
        </div>
      </Shell>
    );
  }

  const isLiked = user ? post.likedBy?.includes(user.uid) : false;

  return (
    <Shell>
      <div className="space-y-5 max-w-3xl pb-8">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 press-effect"
          onClick={() => router.push('/community')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border border-border/60 shrink-0">
                <AvatarImage src={post.photoURL} alt={post.username} />
                <AvatarFallback className="bg-muted text-xs font-medium">
                  {(post.username || '?')[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{post.username}</span>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-medium border-primary/20 text-primary">
                    {post.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    <TimeAgo date={post.createdAt} />
                    {post.isEdited && <span className="text-[10px] opacity-60">(edited)</span>}
                  </span>
                </div>
                <h1 className="text-lg font-headline font-bold mt-2 leading-snug">
                  {post.title}
                </h1>
                <div className="prose prose-invert prose-sm mt-3 max-w-none">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {post.code && (
                  <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border/40">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5" />
                        {post.codeLanguage || 'code'}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(post.code || '');
                          toast({ title: 'Code copied to clipboard' });
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-4 text-sm font-code overflow-x-auto leading-relaxed">
                      <code>{post.code}</code>
                    </pre>
                  </div>
                )}

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {post.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] px-2 py-0 h-5 font-medium"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all duration-200 press-effect',
                )}
                onClick={handleLike}
                disabled={liking}
              >
                <Heart
                  className={cn(
                    'w-4 h-4 transition-all duration-200',
                    isLiked && 'fill-primary text-primary scale-110',
                  )}
                />
                {post.likes}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-primary press-effect"
              >
                <MessageSquare className="w-4 h-4" />
                {post.comments}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-primary press-effect"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/community/posts/${post.id}`);
                  toast({ title: 'Link copied!' });
                }}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <div className="ml-auto">
                <ReportButton targetType="post" targetId={post.id} targetLabel={post.title} />
              </div>
            </div>
          </div>
        </motion.article>

        <Separator className="bg-border/50" />

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-headline font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Comments
              <span className="text-sm font-normal text-muted-foreground">
                ({comments.length})
              </span>
            </h2>
          </div>

          {user && (
            <CommentForm
              onSubmit={handleComment}
              placeholder="Share your thoughts..."
            />
          )}

          {rootComments.length > 0 ? (
            <div className="space-y-1">
              {rootComments.map(comment => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  allComments={comments}
                  currentUserId={user?.uid}
                  onReply={handleReply}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No comments yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Be the first to share your thoughts on this post.
              </p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
