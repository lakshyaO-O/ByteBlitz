import type { Metadata } from 'next';
import { LearningAnalyticsPage } from './analytics-page';

export const metadata: Metadata = {
  title: 'Learning Analytics',
  description: 'Track your learning progress, topic mastery, and get AI-powered recommendations.',
};

export default function Page() {
  return <LearningAnalyticsPage />;
}
