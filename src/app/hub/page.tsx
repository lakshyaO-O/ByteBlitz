import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import HubPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Community Hub',
  description: 'The central hub for DevRann community — report bugs, suggest features, contact the team, and explore events, challenges, and opportunities.',
  alternates: { canonical: `${SITE_URL}/hub` },
  openGraph: {
    title: 'Community Hub | DevRann',
    description: 'Your central place for bug reports, feature requests, events, challenges, and community interactions.',
  },
};

export default function HubPage() {
  return <HubPageClient />;
}
