import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageCircle, Bug } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contact ${SITE_NAME} support. Get help, report bugs, or reach the team.`,
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: `Contact | ${SITE_NAME}`,
    description: `Contact ${SITE_NAME} support. Get help, report bugs, or reach the team.`,
  },
  twitter: {
    title: `Contact | ${SITE_NAME}`,
    description: `Contact ${SITE_NAME} support. Get help, report bugs, or reach the team.`,
  },
};

const contactMethods = [
  {
    icon: Mail,
    label: 'Email Support',
    desc: 'For account issues, billing, and general inquiries.',
    action: 'support@devrann.app',
    href: 'mailto:support@devrann.app',
  },
  {
    icon: MessageCircle,
    label: 'Community',
    desc: 'Ask questions and get help from the community.',
    action: 'Join our Community',
    href: '/community',
  },
  {
    icon: Bug,
    label: 'Report a Bug',
    desc: 'Found something broken? Let us know.',
    action: 'Report on GitHub',
    href: 'https://github.com/lakshyaO-O/ByteBlitz/issues',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-headline font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground mb-12">
          Get help, report issues, or reach the DevRann team.
        </p>

        <div className="grid gap-6">
          {contactMethods.map((method) => (
            <a
              key={method.label}
              href={method.href}
              className="flex items-start gap-4 p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <method.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline font-semibold text-foreground mb-1">{method.label}</h3>
                <p className="text-sm text-muted-foreground mb-2">{method.desc}</p>
                <span className="text-sm text-primary font-medium">{method.action} &rarr;</span>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-lg bg-muted/30 border border-border">
          <h2 className="font-headline font-semibold text-foreground mb-2">Response Times</h2>
          <p className="text-sm text-muted-foreground">
            We aim to respond to all inquiries within 24 hours during business days. For urgent issues,
            reach us in the community or check existing GitHub issues.
          </p>
        </div>
      </div>
    </div>
  );
}
