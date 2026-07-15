import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import ForumPage from './page-client';

export const metadata: Metadata = {
  title: 'Community Forum',
  description: 'Join the DevRann community forum. Discuss coding problems, share solutions, ask questions, and connect with fellow developers.',
  alternates: {
    canonical: `${SITE_URL}/forum`,
  },
  openGraph: {
    title: 'Community Forum | DevRann',
    description: 'Join the DevRann community forum. Discuss coding problems, share solutions, and connect with developers.',
  },
  twitter: {
    title: 'Community Forum | DevRann',
    description: 'Join the DevRann community forum. Discuss coding problems, share solutions, and connect with developers.',
  },
};

export default function ForumPageWrapper() {
  return <ForumPage />;
}
