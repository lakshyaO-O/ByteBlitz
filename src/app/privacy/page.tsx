import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${SITE_NAME}. Learn how we collect, use, and protect your data.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: `Privacy Policy | ${SITE_NAME}`,
    description: `Privacy Policy for ${SITE_NAME}. Learn how we collect, use, and protect your data.`,
  },
  twitter: {
    title: `Privacy Policy | ${SITE_NAME}`,
    description: `Privacy Policy for ${SITE_NAME}. Learn how we collect, use, and protect your data.`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-headline font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">1. Information We Collect</h2>
            <p className="mb-2">We collect information you provide when creating an account, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email address and display name</li>
              <li>Profile information (avatar, bio, social links)</li>
              <li>Code submissions, battle history, and platform activity</li>
              <li>Communication preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and maintain the platform</li>
              <li>Match opponents, calculate rankings, and process battles</li>
              <li>Deliver AI-powered code review and learning features</li>
              <li>Send service notifications and updates</li>
              <li>Improve platform performance and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">3. Data Storage and Security</h2>
            <p>Your data is stored securely using Firebase (Google Cloud Platform). We implement industry-standard security measures including encryption in transit and at rest. We retain your data for as long as your account is active. You may request deletion at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">4. Third-Party Services</h2>
            <p className="mb-2">We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Firebase</strong> (Google) — Authentication, database, and hosting</li>
              <li><strong>Google Analytics</strong> — Anonymous usage analytics (opt-out available)</li>
              <li><strong>Google AI (Gemini)</strong> — AI-powered code review and learning features</li>
              <li><strong>Vercel</strong> — Application hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">5. Your Rights (GDPR & CCPA)</h2>
            <p className="mb-2">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at privacy@devrann.app.</p>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">6. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We also use Google Analytics cookies for anonymous usage statistics. You can manage cookie preferences through your browser settings. A cookie consent banner is provided on your first visit.</p>
          </section>

          <section>
            <h2 className="text-lg font-headline font-semibold text-foreground mb-3">7. Contact</h2>
            <p>For privacy inquiries: privacy@devrann.app</p>
          </section>
        </div>
      </div>
    </div>
  );
}
