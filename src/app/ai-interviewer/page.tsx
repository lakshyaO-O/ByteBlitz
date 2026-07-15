import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import AIInterviewerPage from './page-client';

export const metadata: Metadata = {
  title: 'AI Interviewer',
  description: 'Practice coding interviews with AI. Get mock interviews on DSA, system design, behavioral questions, frontend, backend, and more. Receive instant feedback and scores.',
  alternates: {
    canonical: `${SITE_URL}/ai-interviewer`,
  },
  openGraph: {
    title: 'AI Interviewer | DevRann',
    description: 'Practice coding interviews with AI. Get mock interviews with instant feedback, scoring, and improvement suggestions.',
  },
  twitter: {
    title: 'AI Interviewer | DevRann',
    description: 'Practice coding interviews with AI. Get mock interviews with instant feedback, scoring, and improvement suggestions.',
  },
};

export default function AIInterviewerPageWrapper() {
  return <AIInterviewerPage />;
}
