'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageSquare, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { CommunityPost } from '@/types';

interface PostActionsProps {
  post: CommunityPost;
  isLiked: boolean;
  onLike: () => void;
  onShare?: () => void;
  compact?: boolean;
}

export function PostActions({ post, isLiked, onLike, compact }: PostActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/community/posts/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard' });
    } catch {
      toast({ title: 'Failed to copy link' });
    }
  }, [post.id, toast]);

  const handleBookmark = useCallback(() => {
    setBookmarked(prev => !prev);
    toast({ title: bookmarked ? 'Bookmark removed' : 'Post bookmarked' });
  }, [bookmarked, toast]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('flex items-center gap-1', compact ? 'pt-2' : 'pt-3 border-t border-border')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all duration-200 press-effect',
                compact && 'h-7 px-2',
              )}
              onClick={onLike}
              aria-label={isLiked ? 'Unlike this post' : 'Like this post'}
            >
              <Heart
                className={cn(
                  'w-3.5 h-3.5 transition-all duration-200',
                  isLiked && 'fill-primary text-primary scale-110',
                )}
              />
              <span>{post.likes}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{isLiked ? 'Unlike' : 'Like'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all duration-200 press-effect',
                compact && 'h-7 px-2',
              )}
              onClick={() => router.push(`/community/posts/${post.id}`)}
              aria-label={`${post.comments} comments`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{post.comments}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Comments</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all duration-200 press-effect',
                compact && 'h-7 px-2',
              )}
              onClick={handleShare}
              aria-label="Share this post"
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Share</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all duration-200 press-effect',
                compact && 'h-7 px-2',
              )}
              onClick={handleBookmark}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this post'}
            >
              <Bookmark
                className={cn(
                  'w-3.5 h-3.5 transition-all duration-200',
                  bookmarked && 'fill-primary text-primary',
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{bookmarked ? 'Saved' : 'Save'}</TooltipContent>
        </Tooltip>

        <div className="ml-auto">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-xs text-muted-foreground hover:text-foreground transition-all duration-200 press-effect',
                      compact && 'h-7 w-7 p-0',
                    )}
                    aria-label="More options"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">More</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}/community/posts/${post.id}`)}>
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem>Report post</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-muted-foreground">
                {post.type.replace('_', ' ')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
