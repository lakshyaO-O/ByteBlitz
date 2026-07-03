import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import { AppStoreProvider } from '@/store/app-store';
import { SessionCookieSync } from '@/components/auth/SessionCookieSync';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { AppStartupDecorations } from '@/components/AppStartupDecorations';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_KEYWORDS, TWITTER_HANDLE } from '@/lib/seo';

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Learn Coding, Practice DSA & Compete Live`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'technology',
  classification: 'Competitive Programming Platform',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: `${SITE_NAME} - Competitive Coding Platform`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
    countryName: 'United States',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Competitive Coding Platform`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Competitive Coding Platform`,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
    creator: TWITTER_HANDLE,
    site: TWITTER_HANDLE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/icon.svg', color: '#28f7a5' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
    startupImage: '/icons/apple-touch-icon.svg',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#05070f',
    'msapplication-config': 'none',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#05070f' },
    { media: '(prefers-color-scheme: light)', color: '#05070f' },
  ],
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
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  name: 'DevRann',
                  url: SITE_URL,
                  description: 'Learn programming, practice DSA, compete in live coding arenas, and build your developer profile with AI-powered tools.',
                  applicationCategory: 'EducationalApplication',
                  educationalUse: 'Learn programming, practice algorithms, compete in coding battles',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'Organization',
                  name: 'DevRann',
                  url: SITE_URL,
                  logo: `${SITE_URL}/logo.svg`,
                  description: 'Competitive coding platform for learning, practice, and live coding battles.',
                  foundingDate: '2025',
                  contactPoint: {
                    '@type': 'ContactPoint',
                    contactType: 'support',
                    url: `${SITE_URL}/community`,
                  },
                  sameAs: [
                    'https://github.com/lakshyaO-O/ByteBlitz',
                  ],
                },
                {
                  '@type': 'WebApplication',
                  name: 'DevRann',
                  url: SITE_URL,
                  applicationCategory: 'EducationalApplication',
                  operatingSystem: 'All',
                  browserRequirements: 'Modern browser with JavaScript enabled',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${sourceCodePro.variable} font-body antialiased bg-background text-foreground selection:bg-primary/30 selection:text-primary`}>
        <GoogleAnalytics />
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
