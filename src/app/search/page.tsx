import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import SearchPage from './page-client';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search DevRann for coding problems, challenges, users, and content. Find what you need across the platform.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_URL}/search`,
  },
};

export default function SearchPageWrapper() {
  return <SearchPage />;
}
