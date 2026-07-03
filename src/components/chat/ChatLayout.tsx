'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shell } from '@/components/layout/Shell';
import { useUser } from '@/firebase/auth/use-user';
import { useChatList } from '@/hooks/use-chat';
import { usePresence } from '@/hooks/use-presence';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { getUserProfile, deleteChat } from '@/services/chat';
import { getOtherParticipant } from '@/config/chat';

export function ChatLayout() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { chats, loading: chatsLoading } = useChatList(user?.uid || null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<{ id: string; username: string; photoURL: string; onlineStatus: string } | null>(null);
  const [showList, setShowList] = useState(true);

  usePresence(user?.uid || null);

  useEffect(() => {
    if (!user) { setOtherUser(null); return; }
    if (!activeChatId) { setOtherUser(null); return; }
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) return;
    const otherId = getOtherParticipant(chat, user.uid);
    if (!otherId) return;
    getUserProfile(otherId).then(profile => {
      if (profile) setOtherUser({ id: otherId, ...profile });
    });
  }, [activeChatId, chats, user]);

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    setShowList(false);
  }, []);

  const handleBack = useCallback(() => {
    setShowList(true);
  }, []);

  const handleViewProfile = useCallback((userId: string) => {
    router.push(`/profile/${userId}`);
  }, [router]);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    if (!confirm('Delete this conversation?')) return;
    await deleteChat(chatId);
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setOtherUser(null);
    }
  }, [activeChatId]);

  if (authLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground gap-3">
          <p className="text-sm">Sign in to use chat</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h1 className="text-2xl font-headline font-black">Chats</h1>
          <button
            onClick={() => setShowList(!showList)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showList ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 flex rounded-xl overflow-hidden border border-border bg-card/30">
          <div className={cn(
            'w-full md:w-80 md:block border-r border-border',
            showList ? 'block' : 'hidden',
            activeChatId ? 'hidden md:block' : 'block',
          )}>
            <ChatList
              chats={chats}
              userId={user.uid}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              loading={chatsLoading}
            />
          </div>
          <div className={cn(
            'flex-1 flex',
            !showList ? 'block' : 'hidden',
            activeChatId ? 'flex' : 'hidden md:flex',
          )}>
            {activeChatId ? (
              <ChatWindow
                chatId={activeChatId}
                userId={user.uid}
                otherUser={otherUser}
                onBack={handleBack}
                onViewProfile={handleViewProfile}
                onDeleteChat={handleDeleteChat}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-bold">Your Messages</p>
                <p className="text-xs text-center max-w-xs">
                  Send private messages to friends. Click a conversation or start one from a friend&apos;s profile.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
