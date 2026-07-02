import type { Metadata } from 'next';
import LeaderboardPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'View the top coders on DevRann. See who leads in ELO rating, contests won, challenges completed, and overall XP.',
  alternates: {
    canonical: 'https://devrann.com/leaderboard',
  },
  openGraph: {
    title: 'Leaderboard | DevRann',
    description: 'View the top coders on DevRann. See who leads in ELO rating, contests won, and overall XP.',
  },
  twitter: {
    title: 'Leaderboard | DevRann',
    description: 'View the top coders on DevRann. See who leads in ELO rating, contests won, and overall XP.',
  },
};

export default function LeaderboardPage() {
  return <LeaderboardPageClient />;
}
