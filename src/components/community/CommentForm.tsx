'use client';

import { useState, useRef } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';

interface CommentFormProps {
  onSubmit: (text: string) => Promise<void>;
  placeholder?: string;
  replyTo?: string | null;
  onCancelReply?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({ onSubmit, placeholder = 'Write a comment...', replyTo, onCancelReply, autoFocus }: CommentFormProps) {
  const { user } = useUser();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className={cn('flex gap-3', replyTo && 'ml-8')}>
      <Avatar className="h-8 w-8 border border-border shrink-0 mt-0.5">
        <AvatarFallback className="bg-muted text-xs">
          {(user.displayName || 'Y')[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className={cn(
              'w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground/50',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'transition-all duration-200',
            )}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            autoFocus={autoFocus}
            aria-label="Write a comment"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {replyTo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelReply}
                className="h-7 text-[10px] text-muted-foreground gap-1 px-2"
              >
                <X className="w-3 h-3" />
                Cancel reply
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] text-muted-foreground/50">
              {text.length > 0 && `${text.length} chars`}
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="h-7 gap-1.5 text-xs px-3 press-effect"
            >
              {submitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              {replyTo ? 'Reply' : 'Comment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
