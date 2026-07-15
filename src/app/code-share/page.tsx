import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import CodeSharePage from './page-client';

export const metadata: Metadata = {
  title: 'Code Share',
  description: 'Share code snippets with the DevRann community. Paste, share, and discuss code in multiple programming languages.',
  alternates: {
    canonical: `${SITE_URL}/code-share`,
  },
  openGraph: {
    title: 'Code Share | DevRann',
    description: 'Share code snippets with the DevRann community. Paste, share, and discuss code in multiple programming languages.',
  },
  twitter: {
    title: 'Code Share | DevRann',
    description: 'Share code snippets with the DevRann community. Paste, share, and discuss code in multiple programming languages.',
  },
};

export default function CodeSharePageWrapper() {
  return <CodeSharePage />;
}
