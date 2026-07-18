'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { PostCard } from '@/components/community/PostCard';
import { PostSkeletonCard } from '@/components/community/SkeletonCard';
import { EmptyState } from '@/components/community/EmptyState';
import type { CommunityPost } from '@/types';

interface PostFeedProps {
  posts: CommunityPost[];
  loading: boolean;
  currentUserId?: string;
  onLike: (postId: string) => void;
  likedPosts: Set<string>;
  onCreatePost: () => void;
  hasFilters?: boolean;
}

export function PostFeed({ posts, loading, currentUserId, onLike, likedPosts, onCreatePost, hasFilters }: PostFeedProps) {
  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading posts">
        {Array.from({ length: 4 }).map((_, i) => (
          <PostSkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="w-6 h-6" />}
        title={hasFilters ? 'No posts found' : 'No posts yet'}
        description={
          hasFilters
            ? 'Try adjusting your search or filters to find what you\'re looking for.'
            : 'Be the first developer to start a discussion or share your code.'
        }
        action={!hasFilters ? { label: 'Create your first post', onClick: onCreatePost } : undefined}
      />
    );
  }

  return (
    <div className="space-y-3" role="feed" aria-label="Community posts">
      <AnimatePresence mode="popLayout">
        {posts.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            isLiked={likedPosts.has(post.id)}
            currentUserId={currentUserId}
            onLike={() => onLike(post.id)}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
