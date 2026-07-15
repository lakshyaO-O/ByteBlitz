import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import MissionsPage from './page-client';

export const metadata: Metadata = {
  title: 'Daily Missions',
  description: 'Complete daily coding missions on DevRann to earn XP, DevCoins, and exclusive rewards. Stay consistent and level up your coding skills.',
  alternates: {
    canonical: `${SITE_URL}/missions`,
  },
  openGraph: {
    title: 'Daily Missions | DevRann',
    description: 'Complete daily coding missions to earn XP, DevCoins, and exclusive rewards.',
  },
  twitter: {
    title: 'Daily Missions | DevRann',
    description: 'Complete daily coding missions to earn XP, DevCoins, and exclusive rewards.',
  },
};

export default function MissionsPageWrapper() {
  return <MissionsPage />;
}
