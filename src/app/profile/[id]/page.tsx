import { PublicProfile } from '@/components/social/PublicProfile';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Player Profile | DevRann`,
    description: `View ${id}'s coding profile on DevRann`,
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        <PublicProfile profileId={id} />
      </div>
    </main>
  );
}
