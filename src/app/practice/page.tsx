import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import PracticePageClient from './page-client';

export const metadata: Metadata = {
  title: 'Coding Practice',
  description: 'Practice coding problems across multiple difficulty levels. Improve your DSA skills with real-time feedback, test cases, and detailed solutions.',
  alternates: {
    canonical: `${SITE_URL}/practice`,
  },
  openGraph: {
    title: 'Coding Practice | DevRann',
    description: 'Practice coding problems across multiple difficulty levels. Improve your DSA skills with real-time feedback.',
  },
  twitter: {
    title: 'Coding Practice | DevRann',
    description: 'Practice coding problems across multiple difficulty levels. Improve your DSA skills with real-time feedback.',
  },
};

export default function PracticePage() {
  return <PracticePageClient />;
}
