import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import WeeklyChallengesPage from './page-client';

export const metadata: Metadata = {
  title: 'Weekly Coding Challenges',
  description: 'Compete in weekly coding challenges on DevRann. Solve curated problems, earn XP, climb the leaderboard, and sharpen your programming skills.',
  alternates: {
    canonical: `${SITE_URL}/weekly-challenges`,
  },
  openGraph: {
    title: 'Weekly Coding Challenges | DevRann',
    description: 'Compete in weekly coding challenges. Solve curated problems, earn XP, and climb the leaderboard.',
  },
  twitter: {
    title: 'Weekly Coding Challenges | DevRann',
    description: 'Compete in weekly coding challenges. Solve curated problems, earn XP, and climb the leaderboard.',
  },
};

export default function WeeklyChallengesPageWrapper() {
  return <WeeklyChallengesPage />;
}
