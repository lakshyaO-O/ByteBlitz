'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface ChatInputProps {
  onSend: (text: string, type: 'text' | 'image' | 'file', file?: File) => void;
  onTyping: (typing: boolean) => void;
  disabled?: boolean;
  replyTo?: { text: string } | null;
  onCancelReply?: () => void;
}

export function ChatInput({ onSend, onTyping, disabled, replyTo, onCancelReply }: ChatInputProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTyping = useCallback(() => {
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
  }, [onTyping]);

  const handleSend = () => {
    if (file) {
      const type = file.type.startsWith('image/') ? 'image' : 'file';
      onSend('', type, file);
      setFile(null);
    } else if (text.trim()) {
      onSend(text, 'text');
      setText('');
    }
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText(prev => prev + emoji);
    handleTyping();
  };

  return (
    <div className="p-3 border-t border-border bg-card/50">
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-muted/30 text-xs">
          <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Replying</span>
          <span className="truncate text-muted-foreground/80 flex-1">{replyTo.text}</span>
          <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {file && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-muted/30 text-xs">
          <Paperclip className="w-3 h-3" />
          <span className="truncate flex-1">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex items-center gap-1 pb-1">
          <EmojiPicker onSelect={handleEmojiSelect} />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        <textarea
          value={text}
          onChange={e => { setText(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-primary/30 transition-colors min-h-[36px] max-h-[120px]"
          style={{ height: 'auto' }}
          onInput={e => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
        />

        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !file)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
