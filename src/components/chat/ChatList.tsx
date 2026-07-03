'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatDoc } from '@/config/chat';

interface ChatListProps {
  chats: ChatDoc[];
  userId: string;
  activeChatId?: string | null;
  onSelectChat: (chatId: string) => void;
  loading?: boolean;
}

function formatTime(ts: any): string {
  if (!ts) return '';
  const d = ts?.toDate?.() || new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function otherParticipantName(chat: ChatDoc, userId: string): string {
  const otherId = chat.participants.find(p => p !== userId);
  return chat.participantData?.[otherId || '']?.username || otherId?.slice(0, 8) || 'Unknown';
}

function otherPhoto(chat: ChatDoc, userId: string): string {
  const otherId = chat.participants.find(p => p !== userId);
  return chat.participantData?.[otherId || '']?.photoURL || '';
}

export function ChatList({ chats, userId, activeChatId, onSelectChat, loading }: ChatListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter(c => {
      const name = otherParticipantName(c, userId).toLowerCase();
      return name.includes(q);
    });
  }, [chats, search, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-8 h-8 text-xs bg-muted/30 border-border"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <MessageCircle className="w-8 h-8" />
            <p className="text-xs">No conversations yet</p>
          </div>
        ) : (
          filtered.map(chat => {
            const otherId = chat.participants.find(p => p !== userId) || '';
            const unread = chat.unreadCount?.[userId] || 0;
            const isActive = chat.id === activeChatId;

            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 transition-colors text-left',
                  isActive ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted/30 border-l-2 border-transparent',
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-10 h-10 border border-muted">
                    <AvatarImage src={otherPhoto(chat, userId)} />
                    <AvatarFallback className="bg-muted text-xs">
                      {(otherParticipantName(chat, userId) || '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                  {unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                      {unread > 99 ? '99+' : unread}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate">{otherParticipantName(chat, userId)}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTime(chat.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {chat.lastMessage?.text || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
