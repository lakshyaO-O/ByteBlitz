import type { Metadata } from 'next';
import { SITE_URL, SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo';
import HomeClient from './home-client';

export const metadata: Metadata = {
  title: `${SITE_NAME} - Practice DSA, Compete in 1v1 Coding Battles`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}`,
  },
  openGraph: {
    title: 'DevRann - Competitive Coding Platform',
    description: 'Practice DSA problems, compete in 1v1 coding battles, and track your ELO rating. Supports multiple languages with AI-powered feedback.',
  },
  twitter: {
    title: 'DevRann - Competitive Coding Platform',
    description: 'Practice DSA problems, compete in 1v1 coding battles, and track your ELO rating. Supports multiple languages with AI-powered feedback.',
  },
};

export default function HomePage() {
  return <HomeClient />;
}
