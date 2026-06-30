'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ArrowRight, LogIn } from 'lucide-react';
import Link from 'next/link';

interface RegistrationModalProps {
  open: boolean;
  onClose: () => void;
  redirectPath?: string;
  feature?: string;
}

export function RegistrationModal({ open, onClose, redirectPath = '/auth', feature }: RegistrationModalProps) {
  const registerHref = `/auth?mode=register${redirectPath !== '/auth' ? `&redirect=${encodeURIComponent(redirectPath)}` : ''}`;
  const loginHref = `/auth?mode=login${redirectPath !== '/auth' ? `&redirect=${encodeURIComponent(redirectPath)}` : ''}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-md bg-card border border-border/50 backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-none">
                  <Zap className="w-8 h-8 text-primary fill-primary" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-headline font-black text-foreground uppercase tracking-tight">
                Create Your Free Account
              </h2>

              {/* Message */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature
                  ? `Create an account to ${feature.toLowerCase()} and unlock all CodezArena features.`
                  : 'Create an account to compete with other programmers, track your progress, save achievements, and unlock all CodezArena features.'}
              </p>

              {/* Feature list */}
              <div className="space-y-2 text-left">
                {['Compete in 1v1 coding battles', 'Track your ELO and progress', 'Unlock achievements and rewards', 'Save your solutions'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3 text-primary" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Link
                  href={registerHref}
                  className="group relative flex items-center justify-center gap-2 w-full h-12 text-sm font-headline font-bold text-background bg-primary hover:bg-primary/90 transition-colors uppercase tracking-wider"
                >
                  <span className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>

                <Link
                  href={loginHref}
                  className="flex items-center justify-center gap-2 w-full h-12 text-sm font-headline font-bold text-foreground border border-border hover:bg-muted transition-colors uppercase tracking-wider"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>

                <button
                  onClick={onClose}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
