export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import AuthFormWrapper from './auth-form';

export const metadata: Metadata = {
  title: 'Sign In / Sign Up',
  description: 'Create your DevRann account or sign in to access coding challenges, live arena battles, AI-powered learning, and developer community features.',
  alternates: {
    canonical: 'https://devrann.com/auth',
  },
  openGraph: {
    title: 'Sign In / Sign Up | DevRann',
    description: 'Join DevRann to learn coding, practice DSA, compete in live arenas, and build your developer profile.',
  },
  twitter: {
    title: 'Sign In / Sign Up | DevRann',
    description: 'Join DevRann to learn coding, practice DSA, compete in live arenas, and build your developer profile.',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthPage() {
  return <AuthFormWrapper />;
}
