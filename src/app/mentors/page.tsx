import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import MentorsPage from './page-client';

export const metadata: Metadata = {
  title: 'Mentors',
  description: 'Connect with coding mentors on DevRann. Find experienced developers to guide your learning journey, provide code reviews, and offer career advice.',
  alternates: {
    canonical: `${SITE_URL}/mentors`,
  },
  openGraph: {
    title: 'Mentors | DevRann',
    description: 'Connect with coding mentors. Find experienced developers to guide your learning journey and career.',
  },
  twitter: {
    title: 'Mentors | DevRann',
    description: 'Connect with coding mentors. Find experienced developers to guide your learning journey and career.',
  },
};

export default function MentorsPageWrapper() {
  return <MentorsPage />;
}
