'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const productLinks = [
  { label: 'Practice', href: '/practice' },
  { label: 'Arena', href: '/arena' },
  { label: 'Challenges', href: '/challenges' },
  { label: 'Contests', href: '/contests' },
  { label: 'Leaderboard', href: '/leaderboard' },
];

const aiLinks = [
  { label: 'AI Mentor', href: '/ai-mentor' },
  { label: 'Code Review', href: '/ai-code-review' },
  { label: 'AI Debugger', href: '/ai-debugger' },
  { label: 'Interview Prep', href: '/ai-interviewer' },
  { label: 'Learning Roadmap', href: '/ai-roadmap' },
];

const communityLinks = [
  { label: 'Forum', href: '/forum' },
  { label: 'Community', href: '/community' },
  { label: 'Study Groups', href: '/study-groups' },
  { label: 'Mentors', href: '/mentors' },
  { label: 'Shop', href: '/shop' },
];

const legalLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
  { label: 'Security', href: '/security' },
  { label: 'Docs', href: '/docs' },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="container px-4 mx-auto relative z-10">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-8 text-left"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Image src="/logo.svg" alt="DevRann" width={20} height={20} unoptimized className="h-5 w-5" />
              </div>
              <span className="text-lg font-headline font-bold tracking-tight text-foreground">
                Dev<span className="text-primary">Rann</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
              Competitive coding platform for practice, battles, and AI-powered learning.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Product</p>
            <nav className="flex flex-col gap-2">
              {productLinks.map((link) => (
                <Link key={link.label} href={link.href} className="text-xs text-muted-foreground/70 hover:text-primary hover:translate-x-0.5 transition-all duration-150">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">AI Tools</p>
            <nav className="flex flex-col gap-2">
              {aiLinks.map((link) => (
                <Link key={link.label} href={link.href} className="text-xs text-muted-foreground/70 hover:text-primary hover:translate-x-0.5 transition-all duration-150">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Community</p>
            <nav className="flex flex-col gap-2">
              {communityLinks.map((link) => (
                <Link key={link.label} href={link.href} className="text-xs text-muted-foreground/70 hover:text-primary hover:translate-x-0.5 transition-all duration-150">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Connect</p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://github.com/lakshyaO-O/ByteBlitz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-150"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://discord.gg/devrann"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-3 rounded-xl bg-muted/40 border border-border/50 flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-150"
              >
                Discord
              </a>
              <a
                href="https://twitter.com/devrann"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-3 rounded-xl bg-muted/40 border border-border/50 flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-150"
              >
                Twitter
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mt-12 pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex gap-5">
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-[11px] text-muted-foreground/60 hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            &copy; {new Date().getFullYear()} DevRann. Early Access.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
