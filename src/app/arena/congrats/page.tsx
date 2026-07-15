export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import { Shell } from '@/components/layout/Shell';
import CongratsContentWrapper from './congrats-content';

export const metadata: Metadata = {
  title: 'Battle Complete',
  description: 'Congratulations on completing your coding battle on DevRann. View your results, ELO changes, and battle statistics.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/arena/congrats`,
  },
};

export default function CongratsPage() {
  return (
    <Shell>
      <CongratsContentWrapper />
    </Shell>
  );
}
