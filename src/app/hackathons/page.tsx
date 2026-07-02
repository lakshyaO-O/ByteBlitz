import type { Metadata } from 'next';
import HackathonsPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Hackathons',
  description: 'Participate in hackathons on DevRann. Build projects, compete with teams, showcase your skills, and win prizes.',
  alternates: {
    canonical: 'https://devrann.com/hackathons',
  },
  openGraph: {
    title: 'Hackathons | DevRann',
    description: 'Participate in hackathons, build projects, compete with teams, and win prizes.',
  },
  twitter: {
    title: 'Hackathons | DevRann',
    description: 'Participate in hackathons, build projects, compete with teams, and win prizes.',
  },
};

export default function HackathonsPage() {
  return <HackathonsPageClient />;
}
