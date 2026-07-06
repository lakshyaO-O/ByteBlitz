import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description: `Community guidelines for ${SITE_NAME}. Rules for respectful and constructive participation.`,
  alternates: { canonical: `${SITE_URL}/community/guidelines` },
  openGraph: {
    title: `Community Guidelines | ${SITE_NAME}`,
    description: `Community guidelines for ${SITE_NAME}. Rules for respectful and constructive participation.`,
  },
  twitter: {
    title: `Community Guidelines | ${SITE_NAME}`,
    description: `Community guidelines for ${SITE_NAME}. Rules for respectful and constructive participation.`,
  },
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Community
        </Link>
        <h1 className="text-3xl font-headline font-bold mb-2">Community Guidelines</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">Our Mission</h2>
            <p>DevRann is a platform for developers to learn, practice, and compete. Our community thrives on respect, collaboration, and fair play. These guidelines help maintain a positive environment for everyone.</p>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">Be Respectful</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Treat others with respect. Disagreement is fine; personal attacks are not.</li>
              <li>Provide constructive feedback on code and solutions.</li>
              <li>No harassment, discrimination, or hate speech of any kind.</li>
              <li>Respect others&apos; privacy — do not share personal information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">Fair Play</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Do not cheat in battles or contests. This includes using external assistance during matches.</li>
              <li>Do not use multiple accounts to manipulate rankings.</li>
              <li>Do not exploit bugs or glitches for advantage. Report them instead.</li>
              <li>Do not submit malicious code through the judge engine.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">Content Standards</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Keep discussions relevant to programming and the platform.</li>
              <li>Do not post spam, advertisements, or self-promotion outside designated areas.</li>
              <li>Do not share copyrighted materials without permission.</li>
              <li>Code shared on the platform must be your own work or properly attributed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">Reporting Violations</h2>
            <p>If you see something that violates these guidelines:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Use the report feature on posts, messages, or profiles</li>
              <li>Contact the moderation team at support@devrann.app</li>
              <li>Include relevant links and descriptions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">Enforcement</h2>
            <p>Violations may result in:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>A warning</li>
              <li>Temporary suspension of specific features</li>
              <li>Temporary or permanent account suspension</li>
              <li>Content removal</li>
            </ul>
            <p className="mt-2">We aim to be transparent and fair in enforcement. Appeals can be sent to support@devrann.app.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
