'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { CommunityHeader } from '@/components/community/CommunityHeader';
import { FilterTabs } from '@/components/community/FilterTabs';
import { SearchBar } from '@/components/community/SearchBar';
import { PostFeed } from '@/components/community/PostFeed';
import { CreatePostDialog } from '@/components/community/CreatePostDialog';
import { createPost, getPosts, likePost } from '@/services/community';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import type { CommunityPost, PostType } from '@/types';

export default function CommunityPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const likeQueueRef = useRef<Map<string, Promise<void>>>(new Map());

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const filter = typeFilter !== 'all' ? { type: typeFilter as PostType } : undefined;
      const result = await getPosts(filter);
      setPosts(result.posts);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load posts' });
    }
    setLoading(false);
  }, [typeFilter, toast]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleCreatePost = async (data: {
    type: PostType;
    title: string;
    content: string;
    code?: string;
    codeLanguage?: string;
    tags: string[];
  }) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const id = await createPost({
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        type: data.type,
        title: data.title,
        content: data.content,
        code: data.code,
        codeLanguage: data.codeLanguage as any,
        tags: data.tags,
      });
      if (id) {
        toast({ title: 'Post created!' });
        setCreateOpen(false);
        loadPosts();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Failed to create post' });
    }
    setSubmitting(false);
  };

  const handleLike = useCallback(async (postId: string) => {
    if (!user) return;

    const existing = likeQueueRef.current.get(postId);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const result = await likePost(postId, user.uid);
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
        setLikedPosts(prev => {
          const next = new Set(prev);
          if (result.liked) next.add(postId);
          else next.delete(postId);
          return next;
        });
      } catch {
        toast({ variant: 'destructive', title: 'Failed to update like' });
      }
    })();

    likeQueueRef.current.set(postId, promise);
    await promise;
    likeQueueRef.current.delete(postId);
  }, [user, toast]);

  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <Shell>
      <div className="space-y-5 pb-8">
        <CommunityHeader
          onNewPost={() => {
            if (!user) {
              router.push('/auth');
              return;
            }
            setCreateOpen(true);
          }}
          memberCount={undefined}
          postsToday={undefined}
        />

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <FilterTabs value={typeFilter} onChange={setTypeFilter} />
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        <PostFeed
          posts={filteredPosts}
          loading={loading}
          currentUserId={user?.uid}
          onLike={handleLike}
          likedPosts={likedPosts}
          onCreatePost={() => {
            if (!user) {
              router.push('/auth');
              return;
            }
            setCreateOpen(true);
          }}
          hasFilters={typeFilter !== 'all' || searchQuery !== ''}
        />

        <CreatePostDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreatePost}
          submitting={submitting}
        />
      </div>
    </Shell>
  );
}
