import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${SITE_NAME}. Rules and guidelines for using the platform.`,
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: `Terms of Service | ${SITE_NAME}`,
    description: `Terms of Service for ${SITE_NAME}. Rules and guidelines for using the platform.`,
  },
  twitter: {
    title: `Terms of Service | ${SITE_NAME}`,
    description: `Terms of Service for ${SITE_NAME}. Rules and guidelines for using the platform.`,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-headline font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using DevRann, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">2. Account Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 13 years old to use DevRann</li>
              <li>You are responsible for maintaining account security</li>
              <li>You may not share your account credentials</li>
              <li>You must provide accurate registration information</li>
              <li>One account per person</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">3. Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the platform for any illegal purpose</li>
              <li>Cheat, automate, or exploit the battle/matchmaking system</li>
              <li>Submit malicious code through the judge engine</li>
              <li>Harass, abuse, or threaten other users</li>
              <li>Attempt to access other users' accounts or data</li>
              <li>Use automated tools to scrape or overload the platform</li>
              <li>Reverse engineer or decompile the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">4. Code Submissions</h2>
            <p>Code you submit to DevRann for practice problems and battles remains your intellectual property. By submitting code, you grant DevRann a license to execute, analyze, and display your code solely for platform functionality (e.g., AI review, battle playback).</p>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">5. AI Features</h2>
            <p>AI-powered features (code review, debugging, mentoring) are provided on an "as-is" basis. AI outputs may contain errors. Do not rely solely on AI-generated code or advice for production systems. AI features have usage limits which vary by subscription tier.</p>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">6. Service Availability</h2>
            <p>DevRann is provided "as is" without warranty of uninterrupted service. We may perform maintenance, updates, or suspend access temporarily. We are not liable for any damages arising from service unavailability.</p>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">7. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through settings. Upon termination, your data will be deleted within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">8. Changes to Terms</h2>
            <p>We may update these terms at any time. Material changes will be notified via email or platform notification. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">9. Contact</h2>
            <p>For questions about these terms: legal@devrann.app</p>
          </section>
        </div>
      </div>
    </div>
  );
}
