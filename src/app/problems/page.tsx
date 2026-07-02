import type { Metadata } from 'next';
import ProblemsPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Coding Problems',
  description: 'Solve a vast collection of coding problems. From beginner to expert, practice DSA, algorithms, and system design with real-world challenges.',
  alternates: {
    canonical: 'https://devrann.com/problems',
  },
  openGraph: {
    title: 'Coding Problems | DevRann',
    description: 'Solve a vast collection of coding problems. Practice DSA, algorithms, and system design.',
  },
  twitter: {
    title: 'Coding Problems | DevRann',
    description: 'Solve a vast collection of coding problems. Practice DSA, algorithms, and system design.',
  },
};

export default function ProblemsPage() {
  return <ProblemsPageClient />;
}
