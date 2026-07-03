'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: Record<string, string | number | boolean>,
    ) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

function usePageViewTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (
      !GA_MEASUREMENT_ID ||
      typeof window === 'undefined' ||
      typeof window.gtag !== 'function'
    )
      return;

    const search = window.location.search;
    const url = pathname + (search || '');

    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);
}

export default function GoogleAnalytics() {
  usePageViewTracking();

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', {
  page_path: window.location.pathname,
});
`,
        }}
      />
    </>
  );
}
