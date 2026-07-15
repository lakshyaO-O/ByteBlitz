import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import ContestCalendarPage from './page-client';

export const metadata: Metadata = {
  title: 'Contest Calendar',
  description: 'Track upcoming coding contests from Codeforces, LeetCode, CodeChef, AtCoder, and more. Never miss a competition with the DevRann contest calendar.',
  alternates: {
    canonical: `${SITE_URL}/contest-calendar`,
  },
  openGraph: {
    title: 'Contest Calendar | DevRann',
    description: 'Track upcoming coding contests from Codeforces, LeetCode, CodeChef, AtCoder, and more.',
  },
  twitter: {
    title: 'Contest Calendar | DevRann',
    description: 'Track upcoming coding contests from Codeforces, LeetCode, CodeChef, AtCoder, and more.',
  },
};

export default function ContestCalendarPageWrapper() {
  return <ContestCalendarPage />;
}
