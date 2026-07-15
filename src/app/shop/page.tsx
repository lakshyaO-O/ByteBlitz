import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import { ShopPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'DevRann Shop | DevCoins Store',
  description: 'Spend your DevCoins on avatar frames, profile themes, badges, titles, and more cosmetic items.',
  alternates: {
    canonical: `${SITE_URL}/shop`,
  },
  openGraph: {
    title: 'DevRann Shop | DevCoins Store',
    description: 'Spend your DevCoins on avatar frames, profile themes, badges, titles, and more cosmetic items.',
  },
  twitter: {
    title: 'DevRann Shop | DevCoins Store',
    description: 'Spend your DevCoins on avatar frames, profile themes, badges, titles, and more cosmetic items.',
  },
};

export default function ShopPage() {
  return <ShopPageClient />;
}
