'use client';

import React from 'react';
import { Crown, Construction } from 'lucide-react';

export default function MonetizationPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
      <div className="relative">
        <Crown className="w-16 h-16 text-yellow-400/40" />
        <Construction className="w-8 h-8 text-yellow-400 absolute -top-1 -right-1" />
      </div>
      <h1 className="text-3xl font-headline font-bold">Premium</h1>
      <p className="text-muted-foreground max-w-md">
        Membership plans are coming soon. Stay tuned for exclusive features, AI credits, and more!
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm font-medium">
        <Construction className="w-4 h-4" /> Coming Soon
      </div>
    </div>
  );
}
