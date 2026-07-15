import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import StudyGroupsPage from './page-client';

export const metadata: Metadata = {
  title: 'Study Groups',
  description: 'Join coding study groups on DevRann. Collaborate with peers, solve problems together, prepare for interviews, and learn in a team environment.',
  alternates: {
    canonical: `${SITE_URL}/study-groups`,
  },
  openGraph: {
    title: 'Study Groups | DevRann',
    description: 'Join coding study groups. Collaborate with peers, solve problems together, and prepare for interviews.',
  },
  twitter: {
    title: 'Study Groups | DevRann',
    description: 'Join coding study groups. Collaborate with peers, solve problems together, and prepare for interviews.',
  },
};

export default function StudyGroupsPageWrapper() {
  return <StudyGroupsPage />;
}
