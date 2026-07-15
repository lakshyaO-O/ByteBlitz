import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import AIMentorPage from './page-client';

export const metadata: Metadata = {
  title: 'AI Mentor',
  description: 'Get personalized coding mentorship from AI. Ask questions about DSA, system design, web development, Python, JavaScript, and more. Learn at your own pace.',
  alternates: {
    canonical: `${SITE_URL}/ai-mentor`,
  },
  openGraph: {
    title: 'AI Mentor | DevRann',
    description: 'Get personalized coding mentorship from AI. Learn DSA, system design, web development, and more with instant AI-powered answers.',
  },
  twitter: {
    title: 'AI Mentor | DevRann',
    description: 'Get personalized coding mentorship from AI. Learn DSA, system design, web development, and more with instant AI-powered answers.',
  },
};

export default function AIMentorPageWrapper() {
  return <AIMentorPage />;
}
