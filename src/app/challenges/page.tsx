import type { Metadata } from 'next';
import ChallengesPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Coding Challenges',
  description: 'Take on daily and weekly coding challenges. Sharpen your programming skills with fun, engaging problems across various difficulty levels.',
  alternates: {
    canonical: 'https://devrann.com/challenges',
  },
  openGraph: {
    title: 'Coding Challenges | DevRann',
    description: 'Take on daily and weekly coding challenges. Sharpen your programming skills.',
  },
  twitter: {
    title: 'Coding Challenges | DevRann',
    description: 'Take on daily and weekly coding challenges. Sharpen your programming skills.',
  },
};

export default function ChallengesPage() {
  return <ChallengesPageClient />;
}
