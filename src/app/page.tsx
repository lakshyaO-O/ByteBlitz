import type { Metadata } from 'next';
import HomeClient from './home-client';

export const metadata: Metadata = {
  title: 'DevRann - Learn Coding, Practice DSA & Compete Live',
  description: 'Learn programming from beginner to advanced, solve coding problems, compete in live coding arenas, track ELO, build projects, and grow with AI-powered learning.',
  alternates: {
    canonical: 'https://devrann.com',
  },
  openGraph: {
    title: 'DevRann - Competitive Coding Platform',
    description: 'Learn programming, practice DSA, compete in live arenas, and build your developer profile with AI-powered tools.',
  },
  twitter: {
    title: 'DevRann - Competitive Coding Platform',
    description: 'Learn programming, practice DSA, compete in live arenas, and build your developer profile with AI-powered tools.',
  },
};

export default function HomePage() {
  return <HomeClient />;
}
