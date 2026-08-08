'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Edit3, Trash2, Reply, FileText } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/config/chat';
import { MessageReactions } from './MessageReactions';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwn: boolean;
  myId: string;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, newText: string) => void;
  onDelete: (messageId: string) => void;
  onReply: (message: ChatMessageType) => void;
  showSender?: boolean;
  showTimestamp?: boolean;
}

function formatTime(ts: any): string {
  if (!ts) return '';
  const d = ts?.toDate?.() || new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ChatMessageBubble({
  message, isOwn, myId, onReact, onEdit, onDelete, onReply, showSender, showTimestamp,
}: ChatMessageProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showMenu, setShowMenu] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && editRef.current) editRef.current.focus();
  }, [editing]);

  if (message.deleted) {
    return (
      <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="text-[10px] text-muted-foreground/40 italic px-3 py-1.5">
          Message deleted
        </div>
      </div>
    );
  }

  const isRead = message.readBy?.length > 1;
  const isImage = message.type === 'image';
  const isFile = message.type === 'file';

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit(message.id, editText);
    }
    setEditing(false);
  };

  return (
    <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start', 'group')}>
      {message.replyTo && (
        <div className={cn(
          'max-w-[75%] px-3 py-1.5 rounded-lg border-l-2 text-xs mb-1',
          isOwn ? 'bg-primary-foreground/10 border-primary/30' : 'bg-muted/30 border-muted-foreground/30',
        )}>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Replying</p>
          <p className="truncate text-muted-foreground/80">{message.replyTo.text}</p>
        </div>
      )}

      <div className={cn('flex gap-2 items-end max-w-[75%]', isOwn && 'flex-row-reverse')}>
        <div
          className={cn(
            'relative rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted/50 border border-border/50 rounded-bl-md',
          )}
          onClick={() => setShowMenu(false)}
        >
          {isImage && message.fileUrl && (
            <div className="mb-2">
              {/* ponytail: arbitrary chat-upload host; next/image needs remotePatterns/proxy */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={message.fileUrl} alt={message.fileName || 'Image'} className="max-w-full rounded-lg max-h-64 object-cover" />
            </div>
          )}

          {isFile && message.fileUrl && (
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/20 mb-2 hover:bg-background/30 transition-colors"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="text-xs truncate">{message.fileName || 'File'}</span>
            </a>
          )}

          {editing ? (
            <div className="flex gap-1">
              <input
                ref={editRef}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false); }}
                className="flex-1 bg-transparent border-b border-current outline-none text-sm"
              />
              <button onClick={handleSaveEdit} className="text-xs font-bold hover:opacity-70">Save</button>
            </div>
          ) : (
            <p>{message.text}</p>
          )}

          <div className={cn('flex items-center gap-1.5 mt-0.5', isOwn ? 'justify-end' : 'justify-start')}>
            {message.edited && <span className="text-[9px] opacity-60">edited</span>}
            {showTimestamp && (
              <span className={cn('text-[9px]', isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground/60')}>
                {formatTime(message.createdAt)}
              </span>
            )}
            {isOwn && (
              isRead
                ? <CheckCheck className="w-3 h-3 text-emerald-400" />
                : <Check className="w-3 h-3 text-muted-foreground/60" />
            )}
          </div>

          <MessageReactions
            reactions={message.reactions || {}}
            myId={myId}
            onReact={(emoji) => onReact(message.id, emoji)}
          />
        </div>

        <div className={cn('flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity', isOwn && 'flex-row-reverse')}>
          <button
            onClick={() => onReply(message)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
            title="Reply"
          >
            <Reply className="w-3 h-3" />
          </button>
          {isOwn && (
            <>
              <button
                onClick={() => { setEditing(true); setEditText(message.text); }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
                title="Edit"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(message.id)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-destructive/10 text-destructive transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
