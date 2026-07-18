import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import CommunityPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Developer Community',
  description: 'Join the DevRann developer community. Share code, showcase projects, discuss programming topics, and connect with fellow coders. Learn together and grow your skills.',
  alternates: {
    canonical: `${SITE_URL}/community`,
  },
  openGraph: {
    title: 'Developer Community | DevRann',
    description: 'Share code, showcase projects, and connect with fellow developers in the DevRann community.',
    type: 'website',
  },
  twitter: {
    title: 'Developer Community | DevRann',
    description: 'Share code, showcase projects, and connect with fellow developers in the DevRann community.',
    card: 'summary_large_image',
  },
};

export default function CommunityPage() {
  return <CommunityPageClient />;
}
