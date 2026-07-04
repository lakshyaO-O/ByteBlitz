import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import CommunityPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Join the DevRann developer community. Share code, showcase projects, discuss programming topics, and connect with fellow coders.',
  alternates: {
    canonical: `${SITE_URL}/community`,
  },
  openGraph: {
    title: 'Community | DevRann',
    description: 'Share code, showcase projects, and connect with fellow developers in the DevRann community.',
  },
  twitter: {
    title: 'Community | DevRann',
    description: 'Share code, showcase projects, and connect with fellow developers in the DevRann community.',
  },
};

export default function CommunityPage() {
  return <CommunityPageClient />;
}
