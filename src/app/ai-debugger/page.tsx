import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import AIDebuggerPage from './page-client';

export const metadata: Metadata = {
  title: 'AI Debugger',
  description: 'Debug code faster with AI. Paste your buggy code and error messages to get root cause analysis, fixes, and prevention tips for JavaScript, Python, Java, C++, and more.',
  alternates: {
    canonical: `${SITE_URL}/ai-debugger`,
  },
  openGraph: {
    title: 'AI Debugger | DevRann',
    description: 'Debug code faster with AI. Paste your buggy code and error messages to get root cause analysis, fixes, and prevention tips.',
  },
  twitter: {
    title: 'AI Debugger | DevRann',
    description: 'Debug code faster with AI. Paste your buggy code and error messages to get root cause analysis, fixes, and prevention tips.',
  },
};

export default function AIDebuggerPageWrapper() {
  return <AIDebuggerPage />;
}
