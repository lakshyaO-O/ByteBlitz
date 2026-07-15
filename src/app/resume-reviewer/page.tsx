import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import ResumeReviewerPage from './page-client';

export const metadata: Metadata = {
  title: 'AI Resume Reviewer',
  description: 'Get your resume reviewed by AI. Upload your resume and get a detailed analysis with strengths, weaknesses, keyword gaps, and actionable suggestions to land more interviews.',
  alternates: {
    canonical: `${SITE_URL}/resume-reviewer`,
  },
  openGraph: {
    title: 'AI Resume Reviewer | DevRann',
    description: 'Get your resume reviewed by AI. Get detailed analysis with strengths, weaknesses, keyword gaps, and actionable suggestions.',
  },
  twitter: {
    title: 'AI Resume Reviewer | DevRann',
    description: 'Get your resume reviewed by AI. Get detailed analysis with strengths, weaknesses, keyword gaps, and actionable suggestions.',
  },
};

export default function ResumeReviewerPageWrapper() {
  return <ResumeReviewerPage />;
}
