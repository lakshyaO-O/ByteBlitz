import type { Metadata } from 'next';
import Link from 'next/link';
import { Home } from 'lucide-react';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist or has been moved. Return to DevRann homepage.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#05070f] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="relative">
          <div className="w-20 h-20 mx-auto relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-30" />
            <div className="absolute inset-2 rounded-full border-2 border-primary/30" />
            <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-headline font-bold text-primary">404</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center mb-2">
            <img src="/logo.svg" alt="DevRann" className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">Page Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
