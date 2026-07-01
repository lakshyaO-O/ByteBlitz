import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import { AppStoreProvider } from '@/store/app-store';
import { SessionCookieSync } from '@/components/auth/SessionCookieSync';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { AppStartupDecorations } from '@/components/AppStartupDecorations';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-headline',
  display: 'swap',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-code',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DevRann | Competitive Coding Arena',
  description: 'The ultimate esports-inspired competitive coding platform.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  appleWebApp: {
    capable: true,
    title: 'DevRann',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#05070f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta httpEquiv="Accept-CH" content="DPR, Width, Viewport-Width" />
        <Script
          id="service-worker"
          strategy="afterInteractive"
        >{`if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); }); }`}</Script>
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${sourceCodePro.variable} font-body antialiased bg-background text-foreground selection:bg-primary/30 selection:text-primary`}>
        <FirebaseClientProvider>
          <GlobalErrorHandler />
          <SessionCookieSync />
          <AppStoreProvider>
            <AppStartupDecorations />
            <RootLayoutClient>
              {children}
            </RootLayoutClient>
          </AppStoreProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
