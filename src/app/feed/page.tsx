import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import FeedPage from './page-client';

export const metadata: Metadata = {
  title: 'Activity Feed',
  description: 'Stay updated with the latest activity on DevRann. See what the community is coding, solving, and sharing in real time.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_URL}/feed`,
  },
};

export default function FeedPageWrapper() {
  return <FeedPage />;
}
