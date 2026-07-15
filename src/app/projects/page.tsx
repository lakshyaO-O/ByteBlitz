import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import ProjectsPage from './page-client';

export const metadata: Metadata = {
  title: 'Coding Projects',
  description: 'Browse and share coding projects on DevRann. Showcase your work, get feedback, and collaborate with the community.',
  alternates: {
    canonical: `${SITE_URL}/projects`,
  },
  openGraph: {
    title: 'Coding Projects | DevRann',
    description: 'Browse and share coding projects. Showcase your work, get feedback, and collaborate with the community.',
  },
  twitter: {
    title: 'Coding Projects | DevRann',
    description: 'Browse and share coding projects. Showcase your work, get feedback, and collaborate with the community.',
  },
};

export default function ProjectsPageWrapper() {
  return <ProjectsPage />;
}
