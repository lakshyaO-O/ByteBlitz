import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import RoomsPage from './page-client';

export const metadata: Metadata = {
  title: 'Coding Rooms',
  description: 'Create and join private coding rooms on DevRann. Battle friends in 1v1 coding duels and practice without ELO pressure.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/rooms`,
  },
};

export default function RoomsPageWrapper() {
  return <RoomsPage />;
}
