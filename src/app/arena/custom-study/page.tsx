import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import CustomStudyPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Custom Study Room | DevRann',
  description:
    'Create or join collaborative study rooms. Solve problems together, chat with peers, and learn as a team — no ELO pressure.',
  alternates: { canonical: `${SITE_URL}/arena/custom-study` },
  openGraph: {
    title: 'Custom Study Room | DevRann Arena',
    description:
      'Collaborative coding rooms for study groups, interview prep, and classrooms. Practice together without affecting ranked ELO.',
  },
};

export default function CustomStudyPage() {
  return <CustomStudyPageClient />;
}
