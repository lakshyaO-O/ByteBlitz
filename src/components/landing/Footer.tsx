'use client';

import { motion } from 'framer-motion';
import { Zap, Github } from 'lucide-react';
import Link from 'next/link';

const links = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Docs', href: '#' },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container px-4 mx-auto">
        <motion.div
          className="flex flex-col md:flex-row justify-between items-center gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-headline font-bold tracking-tight text-foreground">
              Dev<span className="text-primary">Rann</span>
            </span>
          </div>

          <div className="flex gap-6">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex gap-4">
            <a
              href="#"
              className="p-2 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50"
            >
              Discord
            </a>
            <a
              href="#"
              className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50"
            >
              Twitter
            </a>
          </div>
        </motion.div>

        <motion.div
          className="mt-8 pt-8 border-t border-border/30 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} DevRann. Built for the modern architect.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
