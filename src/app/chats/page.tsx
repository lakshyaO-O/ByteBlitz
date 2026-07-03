import type { Metadata } from 'next';
import { ChatLayout } from '@/components/chat/ChatLayout';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Chat with friends in real-time. Send messages, share files, and collaborate.',
  alternates: { canonical: 'https://devrann.com/chats' },
  openGraph: {
    title: 'Messages | DevRann',
    description: 'Chat with friends in real-time.',
  },
  twitter: {
    title: 'Messages | DevRann',
    description: 'Chat with friends in real-time.',
  },
};

export default function ChatsPage() {
  return <ChatLayout />;
}
