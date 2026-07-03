'use client';

import { useState } from 'react';
import { Search, X, Loader2, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/config/chat';

interface ChatSearchProps {
  onSearch: (query: string) => void;
  results: ChatMessage[];
  searching: boolean;
  onSelectResult: (message: ChatMessage) => void;
  onClose: () => void;
}

export function ChatSearch({ onSearch, results, searching, onSelectResult, onClose }: ChatSearchProps) {
  const [query, setQuery] = useState('');

  const handleChange = (val: string) => {
    setQuery(val);
    onSearch(val);
  };

  return (
    <div className="border-b border-border bg-card/50">
      <div className="flex items-center gap-2 px-4 py-2">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder="Search messages..."
          className="h-8 text-xs bg-transparent border-none outline-none focus-visible:ring-0 px-0"
          autoFocus
        />
        {searching && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto border-t border-border">
          {results.map((msg) => (
            <button
              key={msg.id}
              onClick={() => onSelectResult(msg)}
              className="w-full flex items-start gap-3 px-4 py-2 text-xs hover:bg-muted/30 transition-colors text-left"
            >
              <MessageCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-muted-foreground mb-0.5">{msg.senderId.slice(0, 8)}...</p>
                <p className="truncate text-muted-foreground/80">{msg.text}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
