import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import { ChatLayout } from '@/components/chat/ChatLayout';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Chat with friends in real-time. Send messages, share files, and collaborate.',
  alternates: { canonical: `${SITE_URL}/chats` },
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
