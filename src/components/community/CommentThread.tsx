'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TimeAgo } from '@/components/community/TimeAgo';
import { CommentForm } from '@/components/community/CommentForm';
import { ReportButton } from '@/components/admin/ReportButton';
import { cn } from '@/lib/utils';
import type { PostComment } from '@/types';

interface CommentThreadProps {
  comment: PostComment;
  replies?: PostComment[];
  allComments: PostComment[];
  depth?: number;
  maxDepth?: number;
  currentUserId?: string;
  onReply: (parentId: string, text: string) => Promise<void>;
}

export function CommentThread({
  comment, replies, allComments, depth = 0, maxDepth = 5, currentUserId, onReply,
}: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const childReplies = replies?.length
    ? replies
    : allComments.filter(c => c.parentId === comment.id);

  const handleReply = async (text: string) => {
    await onReply(comment.id, text);
    setShowReplyForm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative pl-0',
        depth > 0 && 'ml-6 border-l-2 border-border/40 pl-4',
      )}
    >
      <div className="group relative flex items-start gap-2.5 py-2">
        <Avatar className="h-7 w-7 border border-border/60 shrink-0 mt-0.5">
          <AvatarImage src={comment.photoURL} alt={comment.username} />
          <AvatarFallback className="bg-muted text-[10px] font-medium">
            {(comment.username || '?')[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-foreground">{comment.username}</span>
            <span className="text-[10px] text-muted-foreground">
              <TimeAgo date={comment.createdAt} />
            </span>
            {comment.userId === currentUserId && (
              <Badge variant="outline" className="text-[8px] px-1 h-3.5 border-border/40 text-muted-foreground">
                you
              </Badge>
            )}
          </div>

          <p className="text-sm text-foreground/85 mt-0.5 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground gap-1"
              onClick={() => setShowReplyForm(prev => !prev)}
            >
              <Reply className="w-3 h-3" />
              Reply
            </Button>
            {depth === 0 && childReplies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded(prev => !prev)}
              >
                {expanded ? 'Hide replies' : `${childReplies.length} replies`}
              </Button>
            )}
            <div className="ml-auto">
              <ReportButton
                targetType="comment"
                targetId={comment.id}
                variant="icon"
                className="opacity-0 group-hover:opacity-100"
              />
            </div>
          </div>

          <AnimatePresence>
            {showReplyForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-2"
              >
                <CommentForm
                  onSubmit={handleReply}
                  placeholder="Write a reply..."
                  replyTo={comment.id}
                  onCancelReply={() => setShowReplyForm(false)}
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {expanded && depth < maxDepth && childReplies.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {childReplies.map(reply => (
              <CommentThread
                key={reply.id}
                comment={reply}
                allComments={allComments}
                depth={depth + 1}
                maxDepth={maxDepth}
                currentUserId={currentUserId}
                onReply={onReply}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!expanded && childReplies.length > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="ml-6 text-[10px] text-primary/70 hover:text-primary transition-colors mt-1"
        >
          Show {childReplies.length} more {childReplies.length === 1 ? 'reply' : 'replies'}
        </button>
      )}
    </motion.div>
  );
}
