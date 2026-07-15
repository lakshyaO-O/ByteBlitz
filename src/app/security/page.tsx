import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import SecurityPage from './page-client';

export const metadata: Metadata = {
  title: 'Security Settings',
  description: 'Manage your DevRann account security settings, privacy controls, and authentication methods. Keep your coding profile safe.',
  alternates: {
    canonical: `${SITE_URL}/security`,
  },
  openGraph: {
    title: 'Security Settings | DevRann',
    description: 'Manage your DevRann account security settings and privacy controls.',
  },
  twitter: {
    title: 'Security Settings | DevRann',
    description: 'Manage your DevRann account security settings and privacy controls.',
  },
};

export default function SecurityPageWrapper() {
  return <SecurityPage />;
}
