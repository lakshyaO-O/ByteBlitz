import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://devrann.vercel.app';
export const SITE_NAME = 'DevRann';
export const SITE_DESCRIPTION =
  'Learn programming from beginner to advanced, solve coding problems, compete in live coding arenas, track ELO, build projects, and grow with AI-powered learning.';
export const SITE_KEYWORDS = [
  'DevRann',
  'Competitive Programming',
  'Coding Platform',
  'Programming',
  'DSA',
  'Algorithms',
  'Coding Challenges',
  'Coding Practice',
  'Learn Programming',
  'Python',
  'C++',
  'Java',
  'JavaScript',
  'TypeScript',
  'AI Coding Assistant',
  'Coding Arena',
  'Live Coding',
  'Interview Preparation',
  'Data Structures',
  'Online Judge',
  'Coding Battles',
];

export const TWITTER_HANDLE = '@devrann';

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Learn Coding, Practice DSA & Compete Live`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
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
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
  },
};

export function buildMetadata(overrides: Partial<Metadata> & { title: string; description: string }): Metadata {
  return {
    ...defaultMetadata,
    ...overrides,
    title: overrides.title,
    description: overrides.description,
    openGraph: {
      ...defaultMetadata.openGraph,
      ...overrides.openGraph,
      title: overrides.openGraph?.title || `${overrides.title} | ${SITE_NAME}`,
      description: overrides.openGraph?.description || overrides.description,
    },
    twitter: {
      ...defaultMetadata.twitter,
      ...overrides.twitter,
      title: overrides.twitter?.title || `${overrides.title} | ${SITE_NAME}`,
      description: overrides.twitter?.description || overrides.description,
    },
  };
}

interface PageSeoConfig {
  title: string;
  description: string;
  keywords?: string[];
  path: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function generatePageMetadata(config: PageSeoConfig): Metadata {
  const url = `${SITE_URL}${config.path}`;
  const title = `${config.title} | ${SITE_NAME}`;

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: config.ogTitle || title,
      description: config.ogDescription || config.description,
      url,
      images: config.ogImage ? [{ url: config.ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      title: config.ogTitle || title,
      description: config.ogDescription || config.description,
      images: config.ogImage ? [config.ogImage] : undefined,
    },
    robots: config.noIndex ? { index: false, follow: false } : undefined,
  };
}
