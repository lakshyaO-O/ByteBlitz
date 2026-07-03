'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatDoc, ChatMessage } from '@/config/chat';
import {
  subscribeMessages, subscribeChatList, subscribeTyping,
  sendMessage, markChatRead, toggleReaction,
  editMessage, deleteMessage, searchMessages as searchMessagesService,
  setTypingStatus, createOrGetChat, markMessageRead,
  loadMoreMessages,
} from '@/services/chat';

// ===== CHAT LIST HOOK =====

export function useChatList(userId: string | null) {
  const [chats, setChats] = useState<ChatDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const unsub = subscribeChatList(userId, (list) => {
      setChats(list);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  return { chats, loading, error };
}

// ===== SINGLE CHAT HOOK =====

export function useChat(chatId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!chatId || !userId) { setLoading(false); return; }

    const unsubMsg = subscribeMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);

      // Auto-mark messages as read
      const unread = msgs.filter(m => !m.readBy?.includes(userId) && m.senderId !== userId);
      if (unread.length > 0) {
        markChatRead(chatId, userId);
        unread.forEach(m => markMessageRead(chatId, m.id, userId));
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    const unsubTyping = subscribeTyping(chatId, userId, setTypingUsers);

    return () => { unsubMsg(); unsubTyping(); };
  }, [chatId, userId]);

  const send = useCallback(async (
    text: string, type: 'text' | 'image' | 'file' = 'text',
    replyTo?: { messageId: string; text: string; senderId: string } | null,
    file?: File,
  ): Promise<string | null> => {
    if (!chatId || !userId) return null;
    return sendMessage(chatId, userId, text, type, replyTo || null, file);
  }, [chatId, userId]);

  const react = useCallback(async (messageId: string, emoji: string) => {
    if (!chatId || !userId) return;
    await toggleReaction(chatId, messageId, userId, emoji);
  }, [chatId, userId]);

  const edit = useCallback(async (messageId: string, newText: string) => {
    if (!chatId) return;
    await editMessage(chatId, messageId, newText);
  }, [chatId]);

  const del = useCallback(async (messageId: string) => {
    if (!chatId) return;
    await deleteMessage(chatId, messageId);
  }, [chatId]);

  const setTyping = useCallback((typing: boolean) => {
    if (!chatId || !userId) return;
    setTypingStatus(chatId, userId, typing);
    if (typing) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setTypingStatus(chatId, userId, false);
      }, 3000);
    }
  }, [chatId, userId]);

  const loadMore = useCallback(async () => {
    if (!chatId || messages.length === 0) return;
    const oldest = messages[0];
    const older = await loadMoreMessages(chatId, oldest.id);
    if (older.length > 0) {
      setMessages(prev => [...older.filter(n => !prev.find(p => p.id === n.id)), ...prev]);
    }
  }, [chatId, messages]);

  return {
    messages, typingUsers, loading, error,
    send, react, edit, delete: del, setTyping, loadMore,
  };
}

// ===== CREATE / OPEN CHAT =====

export function useOpenChat() {
  const [chatId, setChatId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const openChat = useCallback(async (uid1: string, uid2: string): Promise<string | null> => {
    setCreating(true);
    try {
      const id = await createOrGetChat(uid1, uid2);
      setChatId(id);
      return id;
    } finally {
      setCreating(false);
    }
  }, []);

  return { chatId, creating, openChat, setChatId };
}

// ===== SEARCH MESSAGES =====

export function useMessageSearch(chatId: string | null) {
  const [results, setResults] = useState<ChatMessage[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!chatId || !query.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await searchMessagesService(chatId, query);
      setResults(res);
    } finally {
      setSearching(false);
    }
  }, [chatId]);

  return { results, searching, search, clear: () => setResults([]) };
}
