import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import LearningPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Learning Roadmap',
  description: 'Follow a structured learning roadmap from beginner to advanced. Master programming fundamentals, DSA, and competitive programming with AI-powered guidance.',
  alternates: {
    canonical: `${SITE_URL}/learning`,
  },
  openGraph: {
    title: 'Learning Roadmap | DevRann',
    description: 'Follow a structured learning roadmap from beginner to advanced with AI-powered guidance.',
  },
  twitter: {
    title: 'Learning Roadmap | DevRann',
    description: 'Follow a structured learning roadmap from beginner to advanced with AI-powered guidance.',
  },
};

export default function LearningPage() {
  return <LearningPageClient />;
}
