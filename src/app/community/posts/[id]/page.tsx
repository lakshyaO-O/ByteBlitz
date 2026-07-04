import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import PostDetailPageClient from './page-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Community Post`,
    description: `View community post on DevRann. Join the discussion, share code, and connect with fellow developers.`,
    alternates: {
      canonical: `${SITE_URL}/community/posts/${id}`,
    },
    openGraph: {
      title: `Community Post | DevRann`,
      description: `View community post on DevRann. Join the discussion and share code.`,
    },
    twitter: {
      title: `Community Post | DevRann`,
      description: `View community post on DevRann. Join the discussion and share code.`,
    },
  };
}

export default function PostDetailPage() {
  return <PostDetailPageClient />;
}
