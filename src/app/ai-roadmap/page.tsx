import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import AIRoadmapPage from './page-client';

export const metadata: Metadata = {
  title: 'AI Learning Roadmap',
  description: 'Generate a personalized learning roadmap with AI. Tell us your current level, goals, and time commitment to get a custom study plan with weekly schedules and resources.',
  alternates: {
    canonical: `${SITE_URL}/ai-roadmap`,
  },
  openGraph: {
    title: 'AI Learning Roadmap | DevRann',
    description: 'Generate a personalized learning roadmap with AI. Get a custom study plan with weekly schedules and curated resources.',
  },
  twitter: {
    title: 'AI Learning Roadmap | DevRann',
    description: 'Generate a personalized learning roadmap with AI. Get a custom study plan with weekly schedules and curated resources.',
  },
};

export default function AIRoadmapPageWrapper() {
  return <AIRoadmapPage />;
}
