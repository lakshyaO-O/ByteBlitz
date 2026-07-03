'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getEmojiList } from '@/config/chat';
import type { MessageReactions as ReactionsType } from '@/config/chat';

interface MessageReactionsProps {
  reactions: ReactionsType;
  myId: string;
  onReact: (emoji: string) => void;
}

export function MessageReactions({ reactions, myId, onReact }: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const emojis = getEmojiList();

  const entries = Object.entries(reactions).filter(([_, users]) => users.length > 0);

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {entries.map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-colors',
            users.includes(myId)
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-muted-foreground/30',
          )}
        >
          <span className="text-xs">{emoji}</span>
          <span className="font-mono">{users.length}</span>
        </button>
      ))}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="w-5 h-5 flex items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-foreground/30 text-xs transition-colors"
        title="Add reaction"
      >
        +
      </button>
      {showPicker && (
        <div className="absolute bottom-full mb-1 bg-card border border-border rounded-xl p-2 shadow-2xl z-50">
          <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onReact(emoji); setShowPicker(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted/50 text-sm transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
