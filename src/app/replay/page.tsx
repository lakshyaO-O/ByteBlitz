import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import ReplayPage from './page-client';

export const metadata: Metadata = {
  title: 'Match Replays',
  description: 'Watch replays of past coding battles on DevRann. Analyze strategies, review code, and learn from top competitors.',
  alternates: {
    canonical: `${SITE_URL}/replay`,
  },
  openGraph: {
    title: 'Match Replays | DevRann',
    description: 'Watch replays of past coding battles. Analyze strategies and learn from top competitors.',
  },
  twitter: {
    title: 'Match Replays | DevRann',
    description: 'Watch replays of past coding battles. Analyze strategies and learn from top competitors.',
  },
};

export default function ReplayPageWrapper() {
  return <ReplayPage />;
}
