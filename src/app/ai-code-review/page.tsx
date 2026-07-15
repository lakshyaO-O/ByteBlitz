import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import AICodeReviewPage from './page-client';

export const metadata: Metadata = {
  title: 'AI Code Review',
  description: 'Get instant AI-powered code reviews. Improve your code quality with feedback on best practices, performance, security, and readability across JavaScript, Python, Java, C++, and more.',
  alternates: {
    canonical: `${SITE_URL}/ai-code-review`,
  },
  openGraph: {
    title: 'AI Code Review | DevRann',
    description: 'Get instant AI-powered code reviews. Improve code quality with feedback on best practices, performance, and security.',
  },
  twitter: {
    title: 'AI Code Review | DevRann',
    description: 'Get instant AI-powered code reviews. Improve code quality with feedback on best practices, performance, and security.',
  },
};

export default function AICodeReviewPageWrapper() {
  return <AICodeReviewPage />;
}
