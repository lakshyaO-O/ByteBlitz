import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import ArenaPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Coding Arena',
  description: 'Battle other coders 1v1 in real-time coding challenges. Earn ELO rating, climb the leaderboard, and prove your skills in the DevRann arena.',
  alternates: {
    canonical: `${SITE_URL}/arena`,
  },
  openGraph: {
    title: 'Coding Arena | DevRann',
    description: 'Battle other coders 1v1 in real-time. Earn ELO rating and climb the leaderboard.',
  },
  twitter: {
    title: 'Coding Arena | DevRann',
    description: 'Battle other coders 1v1 in real-time. Earn ELO rating and climb the leaderboard.',
  },
};

export default function ArenaPage() {
  return <ArenaPageClient />;
}
