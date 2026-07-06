import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Code2, MessageCircle, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation',
  description: `Developer documentation for ${SITE_NAME}. Getting started guides and resources.`,
  alternates: { canonical: `${SITE_URL}/docs` },
  openGraph: {
    title: `Documentation | ${SITE_NAME}`,
    description: `Developer documentation for ${SITE_NAME}. Getting started guides and resources.`,
  },
  twitter: {
    title: `Documentation | ${SITE_NAME}`,
    description: `Developer documentation for ${SITE_NAME}. Getting started guides and resources.`,
  },
};

const resources = [
  {
    icon: BookOpen,
    label: 'Getting Started',
    desc: 'Learn how to create an account, set up your profile, and navigate the platform.',
    href: '/learning',
  },
  {
    icon: Code2,
    label: 'Practice Problems',
    desc: 'Browse our problem archive, understand difficulty tiers, and use the code editor.',
    href: '/practice',
  },
  {
    icon: MessageCircle,
    label: 'Community Forum',
    desc: 'Ask questions, share solutions, and discuss with other developers.',
    href: '/forum',
  },
  {
    icon: ExternalLink,
    label: 'GitHub Repository',
    desc: 'Report bugs, request features, or contribute to the open-source codebase.',
    href: 'https://github.com/lakshyaO-O/ByteBlitz',
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-headline font-bold mb-2">Documentation</h1>
        <p className="text-muted-foreground mb-12">
          Resources to help you get the most out of DevRann.
        </p>

        <div className="grid gap-4">
          {resources.map((resource) => (
            <a
              key={resource.label}
              href={resource.href}
              className="flex items-start gap-4 p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <resource.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline font-semibold text-foreground mb-1">{resource.label}</h3>
                <p className="text-sm text-muted-foreground">{resource.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
