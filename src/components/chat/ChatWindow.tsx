'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { ChatMessageBubble } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatSearch } from './ChatSearch';
import { useChat, useMessageSearch } from '@/hooks/use-chat';
import type { ChatMessage as ChatMessageType } from '@/config/chat';

interface ChatWindowProps {
  chatId: string;
  userId: string;
  otherUser: { id: string; username: string; photoURL: string; onlineStatus: string } | null;
  onBack?: () => void;
  onViewProfile?: (userId: string) => void;
  onDeleteChat?: (chatId: string) => void;
}

export function ChatWindow({
  chatId, userId, otherUser, onBack, onViewProfile, onDeleteChat,
}: ChatWindowProps) {
  const { messages, typingUsers, loading, send, react, edit, delete: deleteMsg, setTyping } = useChat(chatId, userId);
  const { results, searching, search, clear: clearSearch } = useMessageSearch(chatId);
  const [replyTo, setReplyTo] = useState<ChatMessageType | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current && messages.length > prevLenRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevLenRef.current = messages.length;
  }, [messages]);

  const handleSend = useCallback(async (text: string, type: 'text' | 'image' | 'file', file?: File) => {
    const reply = replyTo ? { messageId: replyTo.id, text: replyTo.text, senderId: replyTo.senderId } : undefined;
    await send(text, type, reply, file);
    setReplyTo(null);
  }, [send, replyTo]);

  const handleSearchResult = useCallback((msg: ChatMessageType) => {
    clearSearch();
    setShowSearch(false);
  }, [clearSearch]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <MessageCircle className="w-12 h-12" />
        <p className="text-sm">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader
        username={otherUser.username}
        photoURL={otherUser.photoURL}
        onlineStatus={otherUser.onlineStatus}
        typingUsers={typingUsers}
        onBack={onBack}
        onSearch={() => setShowSearch(!showSearch)}
        onDeleteChat={() => onDeleteChat?.(chatId)}
        onViewProfile={() => onViewProfile?.(otherUser.id)}
      />

      {showSearch && (
        <ChatSearch
          onSearch={search}
          results={results}
          searching={searching}
          onSelectResult={handleSearchResult}
          onClose={() => { setShowSearch(false); clearSearch(); }}
        />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <MessageCircle className="w-10 h-10" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="space-y-3 min-h-full flex flex-col justify-end">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === userId}
                myId={userId}
                onReact={react}
                onEdit={edit}
                onDelete={deleteMsg}
                onReply={setReplyTo}
                showTimestamp
              />
            ))}
          </div>
        )}
      </div>

      <ChatInput
        onSend={handleSend}
        onTyping={setTyping}
        replyTo={replyTo ? { text: replyTo.text } : null}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
