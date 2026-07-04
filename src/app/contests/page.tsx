import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import ContestsPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Coding Contests',
  description: 'Compete against the community in timed coding competitions. Track your ELO rating, climb the leaderboard, and win prizes in live coding battles.',
  alternates: {
    canonical: `${SITE_URL}/contests`,
  },
  openGraph: {
    title: 'Coding Contests | DevRann',
    description: 'Compete in live coding competitions, track your ELO, and win prizes. Join the DevRann arena today.',
  },
  twitter: {
    title: 'Coding Contests | DevRann',
    description: 'Compete in live coding competitions, track your ELO, and win prizes. Join the DevRann arena today.',
  },
};

export default function ContestsPage() {
  return <ContestsPageClient />;
}
