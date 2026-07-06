'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'devrann-cookie-consent';

type ConsentStatus = 'accepted' | 'rejected' | null;

function getStoredConsent(): ConsentStatus {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(CONSENT_KEY);
  if (val === 'accepted' || val === 'rejected') return val;
  return null;
}

function setStoredConsent(status: ConsentStatus) {
  if (status) localStorage.setItem(CONSENT_KEY, status);
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    if (stored === null) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setStoredConsent('accepted');
    setConsent('accepted');
    setVisible(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-accepted'));
  };

  const handleReject = () => {
    setStoredConsent('rejected');
    setConsent('rejected');
    setVisible(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-rejected'));
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4">
      <div className="max-w-2xl mx-auto p-4 rounded-lg border border-border bg-card shadow-lg">
        <p className="text-sm text-foreground mb-3">
          We use essential cookies for authentication and Google Analytics for anonymous usage data.
          See our{' '}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Accept All
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm font-semibold border border-border rounded-md hover:bg-muted transition-colors"
          >
            Necessary Only
          </button>
        </div>
      </div>
    </div>
  );
}
