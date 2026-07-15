import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import CompanyWisePage from './page-client';

export const metadata: Metadata = {
  title: 'Company Wise Interview Prep',
  description: 'Prepare for coding interviews at Google, Amazon, Microsoft, Meta, Apple, and more. Access company-specific interview questions, tips, and practice problems on DevRann.',
  alternates: {
    canonical: `${SITE_URL}/career-hub/company-wise`,
  },
  openGraph: {
    title: 'Company Wise Interview Prep | DevRann',
    description: 'Prepare for coding interviews at Google, Amazon, Microsoft, Meta, Apple and more. Company-specific questions and tips.',
  },
  twitter: {
    title: 'Company Wise Interview Prep | DevRann',
    description: 'Prepare for coding interviews at Google, Amazon, Microsoft, Meta, Apple and more. Company-specific questions and tips.',
  },
};

export default function CompanyWisePageWrapper() {
  return <CompanyWisePage />;
}
