import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import CareerHubPage from './page-client';

export const metadata: Metadata = {
  title: 'Career Hub',
  description: 'Find developer jobs, internships, and freelance opportunities. Prepare for top tech companies with curated interview resources and company-wise prep on DevRann.',
  alternates: {
    canonical: `${SITE_URL}/career-hub`,
  },
  openGraph: {
    title: 'Career Hub | DevRann',
    description: 'Find developer jobs, internships, and freelance opportunities. Prepare for top tech companies with curated interview resources.',
  },
  twitter: {
    title: 'Career Hub | DevRann',
    description: 'Find developer jobs, internships, and freelance opportunities. Prepare for top tech companies with curated interview resources.',
  },
};

export default function CareerHubPageWrapper() {
  return <CareerHubPage />;
}
