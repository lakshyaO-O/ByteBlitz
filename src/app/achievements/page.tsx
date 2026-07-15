import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import AchievementsPage from './page-client';

export const metadata: Metadata = {
  title: 'Achievements',
  description: 'View and track your DevRann achievements. Earn badges, unlock milestones, and showcase your coding accomplishments.',
  alternates: {
    canonical: `${SITE_URL}/achievements`,
  },
  openGraph: {
    title: 'Achievements | DevRann',
    description: 'View and track your DevRann achievements. Earn badges and unlock milestones.',
  },
  twitter: {
    title: 'Achievements | DevRann',
    description: 'View and track your DevRann achievements. Earn badges and unlock milestones.',
  },
};

export default function AchievementsPageWrapper() {
  return <AchievementsPage />;
}
