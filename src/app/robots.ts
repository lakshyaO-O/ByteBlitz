import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const PRIVATE_PREFIXES = ['/api/', '/_next/', '/auth'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/auth',
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/settings/',
          '/notifications/',
          '/monetization/',
          '/chats/',
          '/security/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: PRIVATE_PREFIXES.concat([
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/settings/',
          '/notifications/',
          '/monetization/',
          '/chats/',
          '/security/',
        ]),
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}