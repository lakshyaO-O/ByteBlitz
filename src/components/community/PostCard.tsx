'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Code, Clock, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TimeAgo } from '@/components/community/TimeAgo';
import { PostActions } from '@/components/community/PostActions';
import { ThreeDotMenu } from '@/components/community/ThreeDotMenu';
import { cn } from '@/lib/utils';
import type { CommunityPost } from '@/types';

const TYPE_STYLES: Record<string, { label: string; color: string }> = {
  code_share: { label: 'Code', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  project_showcase: { label: 'Project', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  discussion: { label: 'Discussion', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  tip: { label: 'Tip', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

interface PostCardProps {
  post: CommunityPost;
  isLiked: boolean;
  currentUserId?: string;
  onLike: () => void;
  index?: number;
}

export function PostCard({ post, isLiked, currentUserId, onLike, index = 0 }: PostCardProps) {
  const router = useRouter();
  const typeStyle = TYPE_STYLES[post.type] || TYPE_STYLES.discussion;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
      className="group rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover-lift"
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/u/${post.userId}`); }}
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            aria-label={`View ${post.username}'s profile`}
          >
            <Avatar className="h-10 w-10 border border-border/60">
              <AvatarImage src={post.photoURL} alt={post.username} />
              <AvatarFallback className="bg-muted text-xs font-medium">
                {(post.username || '?')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm text-foreground">{post.username}</span>
                <BadgeCheck className="w-3.5 h-3.5 text-primary" aria-label="Verified" />
              </div>
              <Badge variant="outline" className={cn('text-[10px] px-2 py-0 h-5 font-medium', typeStyle.color)}>
                {typeStyle.label}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" />
                <TimeAgo date={post.createdAt} />
              </span>
              <ThreeDotMenu
                postId={post.id}
                isOwner={post.userId === currentUserId}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>

            <h3
              className="font-semibold text-base cursor-pointer hover:text-primary transition-colors duration-200 leading-snug"
              onClick={() => router.push(`/community/posts/${post.id}`)}
            >
              {post.title}
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {post.content}
            </p>

            {post.code && (
              <div className="relative mt-2 rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border/40">
                  <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <Code className="w-3 h-3" />
                    {post.codeLanguage || 'code'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(post.code || '');
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Copy code"
                  >
                    Copy
                  </button>
                </div>
                <pre className="p-3 text-xs font-code overflow-x-auto leading-relaxed max-h-32">
                  <code>{post.code}</code>
                </pre>
              </div>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
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

        <PostActions
          post={post}
          isLiked={isLiked}
          onLike={onLike}
        />
      </div>
    </motion.article>
  );
}
